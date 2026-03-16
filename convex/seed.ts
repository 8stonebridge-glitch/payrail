import { mutation, query } from "./_generated/server";

const companies = [
  {
    key: "QML",
    name: "QuickMove Logistics",
    tag: "QML",
    active: true,
    procurementEnabled: true,
    enabledCategories: ["Operations", "Capex"],
  },
  {
    key: "ACS",
    name: "Aerocool Solutions",
    tag: "ACS",
    active: true,
    procurementEnabled: true,
    enabledCategories: ["Maintenance", "Procurement"],
  },
  {
    key: "PVF",
    name: "PrimeVault Finance",
    tag: "PVF",
    active: true,
    procurementEnabled: false,
    enabledCategories: ["Operations"],
  },
];

const users = [
  {
    key: "sunday",
    name: "Sunday Ajayi",
    email: "sunday@payrail.local",
    assignments: [
      { companyKey: "QML", role: "Admin" },
      { companyKey: "ACS", role: "Admin" },
      { companyKey: "PVF", role: "Admin" },
    ],
  },
  {
    key: "emeka",
    name: "Emeka Obi",
    email: "emeka@quickmove.com",
    assignments: [{ companyKey: "QML", role: "Supervisor" }],
  },
  {
    key: "bola",
    name: "Bola Adeyemi",
    email: "bola@quickmove.com",
    assignments: [{ companyKey: "QML", role: "Head of Ops" }],
  },
  {
    key: "tunde",
    name: "Tunde Bakare",
    email: "tunde@payrail.local",
    assignments: [
      { companyKey: "QML", role: "CFO" },
      { companyKey: "ACS", role: "CFO" },
    ],
  },
  {
    key: "dayo",
    name: "Dayo Ogundimu",
    email: "dayo@quickmove.com",
    assignments: [{ companyKey: "QML", role: "CEO" }],
  },
  {
    key: "ngozi",
    name: "Ngozi Eze",
    email: "ngozi@payrail.local",
    assignments: [
      { companyKey: "QML", role: "Finance" },
      { companyKey: "ACS", role: "Finance" },
      { companyKey: "PVF", role: "Finance" },
    ],
  },
  {
    key: "kalu",
    name: "Kalu Nwachukwu",
    email: "kalu@aerocool.com",
    assignments: [{ companyKey: "ACS", role: "Team Lead" }],
  },
  {
    key: "amina",
    name: "Amina Ibrahim",
    email: "amina@aerocool.com",
    assignments: [{ companyKey: "ACS", role: "Ops Manager" }],
  },
  {
    key: "femi",
    name: "Femi Adegoke",
    email: "femi@aerocool.com",
    assignments: [{ companyKey: "ACS", role: "MD" }],
  },
  {
    key: "chidera",
    name: "Chidera Okoro",
    email: "chidera@primevault.com",
    assignments: [{ companyKey: "PVF", role: "Supervisor" }],
  },
  {
    key: "yusuf",
    name: "Yusuf Bello",
    email: "yusuf@primevault.com",
    assignments: [{ companyKey: "PVF", role: "Head of Ops" }],
  },
];

const policies = [
  {
    companyKey: "QML",
    name: "Ops ≤ ₦500K",
    category: "Operations",
    minAmount: 0,
    maxAmount: 500000,
    active: true,
    businessSteps: ["Supervisor", "Head of Ops"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 0,
    quoteRuleLabel: undefined,
    requireJustificationIfNotLowest: false,
    allowSingleSourceException: false,
  },
  {
    companyKey: "QML",
    name: "Ops ₦500K–₦2M",
    category: "Operations",
    minAmount: 500001,
    maxAmount: 2000000,
    active: true,
    businessSteps: ["Supervisor", "Head of Ops", "CFO"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 2,
    quoteRuleLabel: "This request requires 2 competitive quotes for operations above ₦500K",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: false,
  },
  {
    companyKey: "QML",
    name: "Capex ≤ ₦5M",
    category: "Capex",
    minAmount: 0,
    maxAmount: 5000000,
    active: true,
    businessSteps: ["Supervisor", "Head of Ops", "CFO"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 2,
    quoteRuleLabel: "This request requires 2 competitive quotes for capital expenditure",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: false,
  },
  {
    companyKey: "QML",
    name: "Capex > ₦5M",
    category: "Capex",
    minAmount: 5000001,
    maxAmount: 999999999,
    active: true,
    businessSteps: ["Supervisor", "Head of Ops", "CFO", "CEO"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 3,
    quoteRuleLabel: "This request requires 3 competitive quotes for capital expenditure above ₦5M",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: true,
  },
  {
    companyKey: "ACS",
    name: "Maintenance ≤ ₦200K",
    category: "Maintenance",
    minAmount: 0,
    maxAmount: 200000,
    active: true,
    businessSteps: ["Team Lead"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 0,
    quoteRuleLabel: undefined,
    requireJustificationIfNotLowest: false,
    allowSingleSourceException: false,
  },
  {
    companyKey: "ACS",
    name: "Maintenance > ₦200K",
    category: "Maintenance",
    minAmount: 200001,
    maxAmount: 999999999,
    active: true,
    businessSteps: ["Team Lead", "Ops Manager", "MD"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 2,
    quoteRuleLabel: "This request requires 2 competitive quotes for maintenance above ₦200K",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: false,
  },
  {
    companyKey: "ACS",
    name: "Procurement ₦200K–₦1M",
    category: "Procurement",
    minAmount: 200001,
    maxAmount: 1000000,
    active: true,
    businessSteps: ["Team Lead", "Ops Manager", "MD"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 3,
    quoteRuleLabel: "This request requires 3 competitive quotes for procurement compliance",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: false,
  },
  {
    companyKey: "ACS",
    name: "Procurement > ₦1M",
    category: "Procurement",
    minAmount: 1000001,
    maxAmount: 999999999,
    active: true,
    businessSteps: ["Team Lead", "Ops Manager", "MD"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 4,
    quoteRuleLabel: "This request requires 4 quotations for high-value procurement compliance",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: true,
  },
  {
    companyKey: "PVF",
    name: "Ops ≤ ₦300K",
    category: "Operations",
    minAmount: 0,
    maxAmount: 300000,
    active: true,
    businessSteps: ["Supervisor", "Head of Ops"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 0,
    quoteRuleLabel: undefined,
    requireJustificationIfNotLowest: false,
    allowSingleSourceException: false,
  },
  {
    companyKey: "PVF",
    name: "Ops > ₦300K",
    category: "Operations",
    minAmount: 300001,
    maxAmount: 999999999,
    active: true,
    businessSteps: ["Supervisor", "Head of Ops"],
    requiresFinanceDisbursement: true,
    requiredQuotes: 2,
    quoteRuleLabel: "This request requires 2 competitive quotes for operations above ₦300K",
    requireJustificationIfNotLowest: true,
    allowSingleSourceException: false,
  },
];

const savedAccounts = [
  {
    userKey: "sunday",
    payeeName: "NNPC Retail Depot",
    bankName: "Zenith Bank",
    accountNumber: "2034567890",
  },
  {
    userKey: "kalu",
    payeeName: "CoolGas Nigeria",
    bankName: "Sterling Bank",
    accountNumber: "0123498765",
  },
  {
    userKey: "chidera",
    payeeName: "OfficeHub Nigeria",
    bankName: "Access Bank",
    accountNumber: "0145678901",
  },
];

export const seedStatus = query({
  args: {},
  handler: async (ctx) => {
    const [companyCount, userCount, requestCount] = await Promise.all([
      ctx.db.query("companies").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("requests").collect(),
    ]);

    return {
      companyCount: companyCount.length,
      userCount: userCount.length,
      requestCount: requestCount.length,
      isSeeded: companyCount.length > 0,
    };
  },
});

export const seedDemoWorkspace = mutation({
  args: {},
  handler: async (ctx) => {
    const existingCompanies = await ctx.db.query("companies").collect();
    if (existingCompanies.length > 0) {
      return {
        seeded: false,
        reason: "Workspace already contains company records.",
      };
    }

    const now = new Date().toISOString();
    const companyIds = new Map<string, any>();
    const userIds = new Map<string, any>();

    for (const company of companies) {
      const companyId = await ctx.db.insert("companies", {
        name: company.name,
        tag: company.tag,
        active: company.active,
        procurementEnabled: company.procurementEnabled,
        enabledCategories: company.enabledCategories,
        createdAt: now,
        updatedAt: now,
      });
      companyIds.set(company.key, companyId);
    }

    for (const user of users) {
      const userId = await ctx.db.insert("users", {
        name: user.name,
        email: user.email,
        active: true,
        createdAt: now,
        updatedAt: now,
      });

      userIds.set(user.key, userId);

      for (const assignment of user.assignments) {
        await ctx.db.insert("userCompanyRoles", {
          userId,
          companyId: companyIds.get(assignment.companyKey),
          role: assignment.role as never,
          active: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const adminUserId = userIds.get("sunday");

    for (const policy of policies) {
      const policyId = await ctx.db.insert("policies", {
        companyId: companyIds.get(policy.companyKey),
        name: policy.name,
        category: policy.category,
        minAmount: policy.minAmount,
        maxAmount: policy.maxAmount,
        active: policy.active,
        currentVersion: 1,
        createdByUserId: adminUserId,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("policyVersions", {
        policyId,
        versionNumber: 1,
        businessSteps: policy.businessSteps as never,
        requiresFinanceDisbursement: policy.requiresFinanceDisbursement,
        requiredQuotes: policy.requiredQuotes,
        quoteRuleLabel: policy.quoteRuleLabel,
        requireJustificationIfNotLowest: policy.requireJustificationIfNotLowest,
        allowSingleSourceException: policy.allowSingleSourceException,
        allowDrafts: false,
        allowRecall: true,
        allowResubmission: true,
        createdByUserId: adminUserId,
        createdAt: now,
      });
    }

    await ctx.db.insert("requestSettings", {
      companyId: undefined,
      allowDrafts: false,
      allowRecall: true,
      allowResubmission: true,
      allowPartialPayment: true,
      payoutPerLineItem: true,
      requestIdMode: "company_tag",
      auditRetentionDays: 365,
      createdAt: now,
      updatedAt: now,
    });

    for (const savedAccount of savedAccounts) {
      await ctx.db.insert("savedAccounts", {
        userId: userIds.get(savedAccount.userKey),
        payeeName: savedAccount.payeeName,
        bankName: savedAccount.bankName,
        accountNumber: savedAccount.accountNumber,
        createdAt: now,
        lastUsedAt: now,
      });
    }

    await ctx.db.insert("settingsAuditLog", {
      module: "seed",
      entityType: "workspace",
      entityId: "demo-seed",
      action: "created",
      changedByUserId: adminUserId,
      oldValueJson: undefined,
      newValueJson: JSON.stringify({
        companies: companies.length,
        users: users.length,
        policies: policies.length,
      }),
      summary: "Seeded demo workspace settings",
      createdAt: now,
    });

    return {
      seeded: true,
      companies: companies.length,
      users: users.length,
      policies: policies.length,
      savedAccounts: savedAccounts.length,
    };
  },
});
