require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Company = require('../models/Company');
const User = require('../models/User');
const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Deal = require('../models/Deal');
const Contact = require('../models/Contact');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const FollowUp = require('../models/FollowUp');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Pipeline = require('../models/Pipeline');

const connectDB = require('../config/database');

const seed = async () => {
  await connectDB();

  console.log('🌱 Starting seed...');

  // Clear existing data
  await Promise.all([
    Company.deleteMany({}), User.deleteMany({}), Lead.deleteMany({}),
    Customer.deleteMany({}), Deal.deleteMany({}), Contact.deleteMany({}),
    Task.deleteMany({}), Activity.deleteMany({}), FollowUp.deleteMany({}),
    Product.deleteMany({}), Notification.deleteMany({}), Pipeline.deleteMany({})
  ]);

  // Create company
  const company = await Company.create({
    name: 'Crefto Solutions Ltd.',
    email: 'info@crefto.com',
    phone: '+1 (555) 100-2000',
    website: 'https://crefto.com',
    address: '123 Innovation Drive',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    industry: 'Technology',
    currency: 'USD',
    timezone: 'America/New_York',
  });

  // Create users (3 roles: manager, developer, sales_rep — all pre-approved)
  const users = await User.insertMany([
    {
      firstName: 'Alex', lastName: 'Mitchell', email: 'admin@crefto.com',
      password: await bcrypt.hash('Admin@123', 12), role: 'manager',
      company: company._id, isEmailVerified: true, isActive: true, approvalStatus: 'approved',
    },
    {
      firstName: 'Sarah', lastName: 'Johnson', email: 'manager@crefto.com',
      password: await bcrypt.hash('Admin@123', 12), role: 'manager',
      company: company._id, isEmailVerified: true, isActive: true, approvalStatus: 'approved',
    },
    {
      firstName: 'James', lastName: 'Wilson', email: 'james@crefto.com',
      password: await bcrypt.hash('Admin@123', 12), role: 'sales_rep',
      company: company._id, isEmailVerified: true, isActive: true, approvalStatus: 'approved',
    },
    {
      firstName: 'Emily', lastName: 'Chen', email: 'emily@crefto.com',
      password: await bcrypt.hash('Admin@123', 12), role: 'sales_rep',
      company: company._id, isEmailVerified: true, isActive: true, approvalStatus: 'approved',
    },
    {
      firstName: 'Michael', lastName: 'Brown', email: 'michael@crefto.com',
      password: await bcrypt.hash('Admin@123', 12), role: 'developer',
      company: company._id, isEmailVerified: true, isActive: true, approvalStatus: 'approved',
    },
  ]);

  const admin = users[0];
  company.createdBy = admin._id;
  await company.save();

  // Create default pipeline
  await Pipeline.create({
    name: 'Sales Pipeline',
    isDefault: true,
    company_ref: company._id,
    createdBy: admin._id,
    stages: [
      { name: 'New', order: 1, color: '#6366F1', probability: 10 },
      { name: 'Qualification', order: 2, color: '#3B82F6', probability: 25 },
      { name: 'Discovery', order: 3, color: '#8B5CF6', probability: 40 },
      { name: 'Proposal', order: 4, color: '#F59E0B', probability: 60 },
      { name: 'Negotiation', order: 5, color: '#EF4444', probability: 75 },
      { name: 'Closed Won', order: 6, color: '#10B981', probability: 100 },
      { name: 'Closed Lost', order: 7, color: '#6B7280', probability: 0 },
    ]
  });

  // Create products
  const products = await Product.insertMany([
    { name: 'CRM Starter Plan', sku: 'CRM-001', description: 'Basic CRM package for small teams', category: 'Software', price: 299, tax: 18, status: 'active', company_ref: company._id, createdBy: admin._id },
    { name: 'CRM Professional Plan', sku: 'CRM-002', description: 'Full-featured CRM for growing businesses', category: 'Software', price: 699, tax: 18, status: 'active', company_ref: company._id, createdBy: admin._id },
    { name: 'CRM Enterprise Plan', sku: 'CRM-003', description: 'Enterprise-grade CRM with dedicated support', category: 'Software', price: 1499, tax: 18, status: 'active', company_ref: company._id, createdBy: admin._id },
    { name: 'Implementation Service', sku: 'SVC-001', description: 'Professional setup and onboarding', category: 'Services', price: 2000, tax: 0, status: 'active', company_ref: company._id, createdBy: admin._id },
    { name: 'Training Package', sku: 'SVC-002', description: '10-hour team training session', category: 'Services', price: 800, tax: 0, status: 'active', company_ref: company._id, createdBy: admin._id },
    { name: 'Custom Integration', sku: 'SVC-003', description: 'Custom API integration development', category: 'Services', price: 3500, tax: 0, status: 'active', company_ref: company._id, createdBy: admin._id },
  ]);

  // Lead data
  const leadData = [
    { firstName: 'Robert', lastName: 'Anderson', company: 'TechVentures Inc.', email: 'robert@techventures.com', phone: '+1 555-0101', source: 'Website', status: 'New', score: 75, expectedValue: 5000, industry: 'Technology', assignedTo: users[2]._id },
    { firstName: 'Jennifer', lastName: 'Martinez', company: 'Global Retail Corp', email: 'jennifer@globalretail.com', phone: '+1 555-0102', source: 'Google', status: 'Contacted', score: 60, expectedValue: 3500, industry: 'Retail', assignedTo: users[3]._id },
    { firstName: 'David', lastName: 'Thompson', company: 'HealthPlus Systems', email: 'david@healthplus.com', phone: '+1 555-0103', source: 'Referral', status: 'Qualified', score: 85, expectedValue: 12000, industry: 'Healthcare', assignedTo: users[2]._id },
    { firstName: 'Lisa', lastName: 'Garcia', company: 'EduTech Solutions', email: 'lisa@edutech.com', phone: '+1 555-0104', source: 'LinkedIn', status: 'Proposal Sent', score: 70, expectedValue: 8000, industry: 'Education', assignedTo: users[3]._id },
    { firstName: 'Mark', lastName: 'Davis', company: 'FinanceFirst Ltd', email: 'mark@financefirst.com', phone: '+1 555-0105', source: 'Cold Call', status: 'Negotiation', score: 90, expectedValue: 25000, industry: 'Finance', assignedTo: users[2]._id },
    { firstName: 'Anna', lastName: 'Wilson', company: 'StartupHub', email: 'anna@startuphub.com', phone: '+1 555-0106', source: 'Facebook', status: 'New', score: 45, expectedValue: 2000, industry: 'Technology', assignedTo: users[3]._id },
    { firstName: 'Chris', lastName: 'Lee', company: 'ManufacturePro', email: 'chris@manufacturepro.com', phone: '+1 555-0107', source: 'Website', status: 'Contacted', score: 55, expectedValue: 15000, industry: 'Manufacturing', assignedTo: users[2]._id },
    { firstName: 'Sandra', lastName: 'White', company: 'RealEstate Pro', email: 'sandra@realestatepro.com', phone: '+1 555-0108', source: 'Google', status: 'Qualified', score: 80, expectedValue: 7500, industry: 'Real Estate', assignedTo: users[3]._id },
    { firstName: 'Kevin', lastName: 'Harris', company: 'LogisticsMaster', email: 'kevin@logisticsmaster.com', phone: '+1 555-0109', source: 'Referral', status: 'New', score: 65, expectedValue: 9000, industry: 'Logistics', assignedTo: users[2]._id },
    { firstName: 'Patricia', lastName: 'Taylor', company: 'MediaGroup', email: 'patricia@mediagroup.com', phone: '+1 555-0110', source: 'Email', status: 'Lost', score: 30, expectedValue: 4000, lostReason: 'Budget constraints', industry: 'Media', assignedTo: users[3]._id },
    { firstName: 'Thomas', lastName: 'Moore', company: 'CloudSystems AG', email: 'thomas@cloudsystems.de', phone: '+49 555-0111', source: 'Website', status: 'Qualified', score: 78, expectedValue: 18000, industry: 'Technology', assignedTo: users[2]._id },
    { firstName: 'Jessica', lastName: 'Jackson', company: 'Retail Express', email: 'jessica@retailexpress.com', phone: '+1 555-0112', source: 'Instagram', status: 'Contacted', score: 50, expectedValue: 3200, industry: 'Retail', assignedTo: users[3]._id },
  ];

  const leads = [];
  for (const l of leadData) {
    const lead = new Lead({ ...l, company_ref: company._id, createdBy: admin._id, nextFollowUpDate: new Date(Date.now() + Math.random() * 7 * 86400000) });
    lead.leadId = `LEAD-${String(leads.length + 1).padStart(4, '0')}`;
    await lead.save();
    leads.push(lead);
  }

  // Create customers (from converted leads)
  const customers = await Customer.insertMany([
    { name: 'Acme Corporation', company: 'Acme Corp', email: 'contact@acme.com', phone: '+1 555-0201', customerType: 'Business', industry: 'Technology', assignedTo: users[2]._id, totalRevenue: 15000, totalDeals: 2, city: 'New York', country: 'USA', status: 'active', customerId: 'CUST-0001', company_ref: company._id, createdBy: admin._id, customerSince: new Date('2024-01-15') },
    { name: 'Nexus Technologies', company: 'Nexus Tech', email: 'hello@nexustech.com', phone: '+1 555-0202', customerType: 'Business', industry: 'Technology', assignedTo: users[3]._id, totalRevenue: 28500, totalDeals: 4, city: 'Austin', country: 'USA', status: 'active', customerId: 'CUST-0002', company_ref: company._id, createdBy: admin._id, customerSince: new Date('2023-09-01') },
    { name: 'Sarah Parker', company: 'Parker Consulting', email: 'sarah.parker@consulting.com', phone: '+1 555-0203', customerType: 'Individual', industry: 'Consulting', assignedTo: users[2]._id, totalRevenue: 8000, totalDeals: 1, city: 'Chicago', country: 'USA', status: 'active', customerId: 'CUST-0003', company_ref: company._id, createdBy: admin._id, customerSince: new Date('2024-03-20') },
    { name: 'HealthCore Medical', company: 'HealthCore', email: 'admin@healthcore.com', phone: '+1 555-0204', customerType: 'Business', industry: 'Healthcare', assignedTo: users[3]._id, totalRevenue: 45000, totalDeals: 3, city: 'Boston', country: 'USA', status: 'active', customerId: 'CUST-0004', company_ref: company._id, createdBy: admin._id, customerSince: new Date('2023-06-12') },
    { name: 'EduPrime Institute', company: 'EduPrime', email: 'contact@eduprime.edu', phone: '+1 555-0205', customerType: 'Business', industry: 'Education', assignedTo: users[2]._id, totalRevenue: 12000, totalDeals: 2, city: 'Seattle', country: 'USA', status: 'active', customerId: 'CUST-0005', company_ref: company._id, createdBy: admin._id, customerSince: new Date('2024-02-01') },
  ]);

  // Create deals
  const dealStages = ['New', 'Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const dealsData = [
    { name: 'Enterprise CRM Implementation', customer: customers[1]._id, value: 15000, stage: 'Closed Won', probability: 100, assignedTo: users[2]._id, wonAt: new Date(Date.now() - 15 * 86400000), expectedClosingDate: new Date(Date.now() - 20 * 86400000) },
    { name: 'Professional Plan - Nexus', customer: customers[1]._id, value: 8400, stage: 'Closed Won', probability: 100, assignedTo: users[3]._id, wonAt: new Date(Date.now() - 30 * 86400000), expectedClosingDate: new Date(Date.now() - 35 * 86400000) },
    { name: 'HealthCore Suite Upgrade', customer: customers[3]._id, value: 22000, stage: 'Negotiation', probability: 75, assignedTo: users[3]._id, expectedClosingDate: new Date(Date.now() + 10 * 86400000) },
    { name: 'EduPrime Starter Package', customer: customers[4]._id, value: 6000, stage: 'Proposal', probability: 60, assignedTo: users[2]._id, expectedClosingDate: new Date(Date.now() + 5 * 86400000) },
    { name: 'Acme Full Integration', customer: customers[0]._id, value: 35000, stage: 'Discovery', probability: 40, assignedTo: users[2]._id, expectedClosingDate: new Date(Date.now() + 20 * 86400000) },
    { name: 'Parker Training Bundle', customer: customers[2]._id, value: 2400, stage: 'Closed Won', probability: 100, assignedTo: users[3]._id, wonAt: new Date(Date.now() - 5 * 86400000) },
    { name: 'TechVentures Custom API', value: 18000, stage: 'Qualification', probability: 25, assignedTo: users[2]._id, expectedClosingDate: new Date(Date.now() + 30 * 86400000) },
    { name: 'HealthCore Annual Renewal', customer: customers[3]._id, value: 14000, stage: 'New', probability: 10, assignedTo: users[3]._id, expectedClosingDate: new Date(Date.now() + 45 * 86400000) },
    { name: 'GlobalRetail CRM', value: 9500, stage: 'Closed Lost', probability: 0, assignedTo: users[2]._id, lostReason: 'Went with competitor', lostAt: new Date(Date.now() - 10 * 86400000) },
    { name: 'Nexus Enterprise Expansion', customer: customers[1]._id, value: 32000, stage: 'Proposal', probability: 60, assignedTo: users[3]._id, expectedClosingDate: new Date(Date.now() + 15 * 86400000) },
  ];

  const deals = [];
  for (let i = 0; i < dealsData.length; i++) {
    const d = new Deal({ ...dealsData[i], company_ref: company._id, createdBy: admin._id });
    d.dealId = `DEAL-${String(i + 1).padStart(4, '0')}`;
    await d.save();
    deals.push(d);
  }

  // Create contacts
  await Contact.insertMany([
    { firstName: 'Tom', lastName: 'Bradley', company: 'Acme Corporation', email: 'tom.bradley@acme.com', phone: '+1 555-0301', jobTitle: 'CEO', department: 'Executive', linkedCustomer: customers[0]._id, company_ref: company._id, createdBy: admin._id },
    { firstName: 'Amy', lastName: 'Reynolds', company: 'Nexus Technologies', email: 'amy@nexustech.com', phone: '+1 555-0302', jobTitle: 'CTO', department: 'Technology', linkedCustomer: customers[1]._id, company_ref: company._id, createdBy: admin._id },
    { firstName: 'Dan', lastName: 'Foster', company: 'HealthCore Medical', email: 'dan@healthcore.com', phone: '+1 555-0303', jobTitle: 'Operations Director', department: 'Operations', linkedCustomer: customers[3]._id, company_ref: company._id, createdBy: admin._id },
    { firstName: 'Monica', lastName: 'Stevens', company: 'EduPrime Institute', email: 'monica@eduprime.edu', phone: '+1 555-0304', jobTitle: 'Head of IT', department: 'IT', linkedCustomer: customers[4]._id, company_ref: company._id, createdBy: admin._id },
  ]);

  // Create tasks
  const now = new Date();
  await Task.insertMany([
    { title: 'Follow up with TechVentures', description: 'Call Robert Anderson regarding proposal status', assignedTo: users[2]._id, relatedLead: leads[0]._id, priority: 'High', status: 'Pending', dueDate: new Date(now.getTime() + 1 * 86400000), company_ref: company._id, createdBy: admin._id },
    { title: 'Prepare HealthCore demo', description: 'Create personalized demo for healthcare module', assignedTo: users[3]._id, relatedDeal: deals[2]._id, priority: 'Urgent', status: 'In Progress', dueDate: new Date(now.getTime() + 2 * 86400000), company_ref: company._id, createdBy: admin._id },
    { title: 'Send EduPrime contract', description: 'Finalize and send the contract documents', assignedTo: users[2]._id, relatedDeal: deals[3]._id, priority: 'High', status: 'Pending', dueDate: new Date(now.getTime() + 3 * 86400000), company_ref: company._id, createdBy: admin._id },
    { title: 'Quarterly review - Nexus', description: 'Schedule Q4 review meeting', assignedTo: users[3]._id, relatedCustomer: customers[1]._id, priority: 'Medium', status: 'Pending', dueDate: new Date(now.getTime() + 7 * 86400000), company_ref: company._id, createdBy: admin._id },
    { title: 'Update CRM product catalog', description: 'Add new pricing tier information', assignedTo: users[0]._id, priority: 'Low', status: 'Pending', dueDate: new Date(now.getTime() + 14 * 86400000), company_ref: company._id, createdBy: admin._id },
    { title: 'Cold call list - Week 1', description: 'Call 20 leads from the new list', assignedTo: users[2]._id, priority: 'Medium', status: 'Completed', dueDate: new Date(now.getTime() - 2 * 86400000), completedAt: new Date(now.getTime() - 1 * 86400000), company_ref: company._id, createdBy: admin._id },
  ]);

  // Create follow-ups
  await FollowUp.insertMany([
    { title: 'Call David Thompson re: proposal', notes: 'Discuss pricing and timeline', scheduledAt: new Date(now.getTime() + 1 * 86400000), type: 'Call', status: 'Pending', assignedTo: users[2]._id, relatedLead: leads[2]._id, company_ref: company._id, createdBy: admin._id },
    { title: 'Email Jennifer Martinez', notes: 'Send updated proposal', scheduledAt: new Date(now.setHours(14, 0, 0, 0)), type: 'Email', status: 'Pending', assignedTo: users[3]._id, relatedLead: leads[1]._id, company_ref: company._id, createdBy: admin._id },
    { title: 'Meeting with HealthCore team', notes: 'Negotiate final contract terms', scheduledAt: new Date(now.getTime() + 3 * 86400000), type: 'Meeting', status: 'Pending', assignedTo: users[3]._id, relatedDeal: deals[2]._id, company_ref: company._id, createdBy: admin._id },
    { title: 'Follow up - Mark Davis negotiation', notes: 'Final pricing discussion', scheduledAt: new Date(now.getTime() - 2 * 86400000), type: 'Call', status: 'Overdue', assignedTo: users[2]._id, relatedLead: leads[4]._id, company_ref: company._id, createdBy: admin._id },
  ]);

  // Create activities
  const activityTypes = ['Call', 'Email', 'Note', 'Meeting', 'WhatsApp'];
  const activityTitles = [
    'Called customer to discuss requirements',
    'Sent follow-up email with product brochure',
    'Added internal note about customer feedback',
    'Had discovery meeting via Zoom',
    'WhatsApp message regarding timeline',
    'Proposal sent via email',
    'Demo scheduled for next week',
  ];

  for (let i = 0; i < 20; i++) {
    await Activity.create({
      type: activityTypes[i % activityTypes.length],
      title: activityTitles[i % activityTitles.length],
      description: 'Detailed notes about the interaction and next steps',
      relatedLead: leads[i % leads.length]._id,
      relatedCustomer: i % 2 === 0 ? customers[i % customers.length]._id : undefined,
      relatedDeal: i % 3 === 0 ? deals[i % deals.length]._id : undefined,
      performedBy: users[Math.floor(Math.random() * 3) + 2]._id,
      company_ref: company._id,
      createdBy: admin._id,
      createdAt: new Date(Date.now() - i * 3 * 3600000),
    });
  }

  // Create notifications
  await Notification.insertMany([
    { title: 'New Lead Assigned', message: 'Robert Anderson from TechVentures has been assigned to you', type: 'lead_assigned', recipient: users[2]._id, relatedLead: leads[0]._id, company_ref: company._id, createdBy: admin._id },
    { title: 'Follow-up Due Today', message: 'You have a follow-up scheduled with David Thompson', type: 'follow_up_due', recipient: users[2]._id, company_ref: company._id, createdBy: admin._id },
    { title: '🎉 Deal Won!', message: 'Enterprise CRM Implementation deal has been won! $15,000', type: 'deal_won', recipient: users[2]._id, relatedDeal: deals[0]._id, company_ref: company._id, createdBy: admin._id },
    { title: 'Task Due Tomorrow', message: 'Prepare HealthCore demo is due tomorrow', type: 'task_due', recipient: users[3]._id, company_ref: company._id, createdBy: admin._id },
    { title: 'Overdue Follow-up', message: 'Follow-up with Mark Davis is overdue', type: 'overdue_task', recipient: users[2]._id, company_ref: company._id, createdBy: admin._id },
  ]);

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Manager:    manager@crefto.com / Admin@123');
  console.log('Developer:  michael@crefto.com / Admin@123');
  console.log('Sales Rep:  james@crefto.com / Admin@123');
  console.log('Sales Rep:  emily@crefto.com / Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
