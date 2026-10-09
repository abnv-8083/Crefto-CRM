import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotationsAPI } from '../../api';
import { ArrowLeft, Printer, Send, CheckCircle, XCircle } from 'lucide-react';
import { Card, Button, Badge, StatusBadge, formatCurrency, formatDate, Skeleton } from '../../components/ui';
import toast from 'react-hot-toast';

const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await quotationsAPI.getOne(id);
        setQuotation(data.data);
      } catch { navigate('/quotations'); }
      finally { setLoading(false); }
    };
    load();
  }, [id, navigate]);

  const handleStatusChange = async (status) => {
    try {
      const { data } = await quotationsAPI.update(id, { status });
      setQuotation(data.data);
      toast.success(`Quotation ${status.toLowerCase()}`);
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (!quotation) return null;

  const subtotal = quotation.items?.reduce((s, item) => s + (item.quantity * item.unitPrice), 0) || 0;
  const discount = quotation.items?.reduce((s, item) => s + (item.quantity * item.unitPrice * (item.discount / 100)), 0) || 0;
  const taxAmount = quotation.taxAmount || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/quotations')} className="p-2 rounded-xl hover:bg-white border border-slate-200 text-slate-500">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-xs text-slate-400">{quotation.quotationId}</p>
            <h1 className="text-xl font-bold text-slate-900">{quotation.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {quotation.status === 'Draft' && (
            <Button size="sm" icon={Send} onClick={() => handleStatusChange('Sent')}>Send</Button>
          )}
          {quotation.status === 'Sent' && (
            <>
              <Button size="sm" variant="success" icon={CheckCircle} onClick={() => handleStatusChange('Accepted')}>Accept</Button>
              <Button size="sm" variant="danger" icon={XCircle} onClick={() => handleStatusChange('Rejected')}>Reject</Button>
            </>
          )}
          <Button variant="outline" size="sm" icon={Printer} onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto print:shadow-none print:max-w-none print:border-0">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src="/logo-light.png" alt="Crefto CRM" className="h-10 object-contain dark:hidden block" />
              <img src="/logo-dark.png" alt="Crefto CRM" className="h-10 object-contain hidden dark:block" />
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-2xl font-bold text-slate-800 mb-1">QUOTATION</h3>
            <p className="text-slate-500 text-sm">{quotation.quotationId}</p>
            <div className="mt-2">
              <Badge variant={quotation.status === 'Accepted' ? 'success' : quotation.status === 'Rejected' ? 'danger' : quotation.status === 'Sent' ? 'info' : 'default'} size="md">
                {quotation.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</h4>
            {quotation.customer ? (
              <div>
                <p className="font-semibold text-slate-800">{quotation.customer.name}</p>
                <p className="text-sm text-slate-500">{quotation.customer.email}</p>
                <p className="text-sm text-slate-500">{quotation.customer.phone}</p>
              </div>
            ) : <p className="text-slate-400 text-sm">No customer assigned</p>}
          </div>
          <div className="text-right">
            <div className="space-y-1">
              {[
                ['Issue Date', formatDate(quotation.createdAt)],
                ['Valid Until', formatDate(quotation.validUntil)],
                ['Created By', `${quotation.createdBy?.firstName} ${quotation.createdBy?.lastName}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-end gap-4">
                  <span className="text-xs text-slate-400">{k}</span>
                  <span className="text-sm font-medium text-slate-700">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="overflow-x-auto mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 rounded-xl">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Unit Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Disc.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Tax</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(quotation.items || []).map((item, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.description || item.product?.name || 'Item'}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{item.discount}%</td>
                  <td className="px-4 py-3 text-right text-sm text-slate-600">{item.taxRate}%</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-800">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-medium text-slate-700">{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-red-500">-{formatCurrency(discount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-700">{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-slate-800">Total</span>
                <span className="font-bold text-xl text-indigo-600">{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {quotation.notes && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</h4>
            <p className="text-sm text-slate-600">{quotation.notes}</p>
          </div>
        )}
        {quotation.termsAndConditions && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Terms & Conditions</h4>
            <p className="text-sm text-slate-500">{quotation.termsAndConditions}</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuotationDetailPage;
