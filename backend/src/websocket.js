const { WebSocketServer, WebSocket } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

let wss = null;
// Map of companyId (string) -> Set of WebSocket clients
const companyClients = new Map();

function initWebSocketServer(server) {
  wss = new WebSocketServer({
    server,
    path: '/ws',
    verifyClient: (info, callback) => {
      try {
        const parsedUrl = url.parse(info.req.url, true);
        const token = parsedUrl.query.token || (info.req.headers['authorization'] || '').replace('Bearer ', '');
        if (!token) {
          return callback(false, 401, 'Unauthorized: No token provided');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        info.req.user = decoded;
        callback(true);
      } catch (err) {
        callback(false, 401, 'Unauthorized: Invalid token');
      }
    }
  });

  wss.on('connection', (ws, req) => {
    const user = req.user;
    ws.user = user;
    ws.isAlive = true;

    const companyId = user.company ? (user.company._id || user.company).toString() : null;
    if (companyId) {
      if (!companyClients.has(companyId)) {
        companyClients.set(companyId, new Set());
      }
      companyClients.get(companyId).add(ws);
    }

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (_) {}
    });

    ws.on('close', () => {
      if (companyId && companyClients.has(companyId)) {
        companyClients.get(companyId).delete(ws);
        if (companyClients.get(companyId).size === 0) {
          companyClients.delete(companyId);
        }
      }
    });

    // Send connection acknowledgement
    try {
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        message: 'WebSocket connected successfully',
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
  });

  // Heartbeat interval to prune dead connections
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('📡 WebSocket server initialized at /ws');
  return wss;
}

function broadcastToCompany(companyId, payload) {
  if (!companyId) return;
  const strCompanyId = companyId.toString();
  const clients = companyClients.get(strCompanyId);
  if (!clients || clients.size === 0) return;

  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
      } catch (_) {}
    }
  });
}

function broadcastDemoRequest(companyId, action, data) {
  broadcastToCompany(companyId, {
    type: 'DEMO_REQUEST_EVENT',
    action, // 'created' | 'updated' | 'started' | 'delivered' | 'deleted'
    data,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initWebSocketServer,
  broadcastToCompany,
  broadcastDemoRequest,
};
