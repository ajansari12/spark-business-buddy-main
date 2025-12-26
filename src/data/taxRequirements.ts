// Province-specific tax requirements for Canadian businesses

export interface TaxRequirement {
  id: string;
  title: string;
  description: string;
  threshold?: string;
  deadline?: string;
  governmentUrl?: string;
  isRequired: boolean;
  appliesTo: ('sole_proprietorship' | 'partnership' | 'corporation')[];
}

export interface ProvinceTaxRequirements {
  provinceCode: string;
  provinceName: string;
  requirements: TaxRequirement[];
}

export const taxRequirementsByProvince: Record<string, ProvinceTaxRequirements> = {
  ON: {
    provinceCode: 'ON',
    provinceName: 'Ontario',
    requirements: [
      {
        id: 'gst_hst',
        title: 'GST/HST Registration',
        description: 'Register for GST/HST if annual revenue exceeds $30,000. Ontario HST rate is 13%.',
        threshold: '$30,000 annual revenue',
        deadline: 'Within 29 days of exceeding threshold',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'payroll',
        title: 'Payroll Deductions Account',
        description: 'Register for payroll deductions if you have employees. Includes CPP, EI, and income tax.',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/set-up-new-employee/employer-responsibilities-register-payroll-program-account.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'wsib',
        title: 'WSIB Registration',
        description: 'Workplace Safety and Insurance Board coverage is mandatory for most businesses with employees in Ontario.',
        governmentUrl: 'https://www.wsib.ca/en/businesses/registration-coverage',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'corporate_tax',
        title: 'Corporate Income Tax',
        description: 'File T2 corporate tax return annually. Ontario corporate tax rate is 11.5% (combined federal/provincial can be 26.5%).',
        deadline: '6 months after fiscal year end',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/corporations.html',
        isRequired: true,
        appliesTo: ['corporation'],
      },
      {
        id: 'eht',
        title: 'Employer Health Tax (EHT)',
        description: 'Pay EHT if Ontario payroll exceeds $1 million. Exemption available for eligible employers up to $1M.',
        threshold: '$1,000,000 annual Ontario payroll',
        governmentUrl: 'https://www.ontario.ca/document/employer-health-tax-eht',
        isRequired: false,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
    ],
  },
  BC: {
    provinceCode: 'BC',
    provinceName: 'British Columbia',
    requirements: [
      {
        id: 'gst',
        title: 'GST Registration',
        description: 'Register for GST if annual revenue exceeds $30,000. BC uses GST (5%) + PST (7%) system.',
        threshold: '$30,000 annual revenue',
        deadline: 'Within 29 days of exceeding threshold',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'pst',
        title: 'PST Registration',
        description: 'Register for BC PST (7%) if you sell taxable goods or services in BC.',
        governmentUrl: 'https://www2.gov.bc.ca/gov/content/taxes/sales-taxes/pst/register',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'payroll',
        title: 'Payroll Deductions Account',
        description: 'Register for payroll deductions if you have employees.',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'worksafe',
        title: 'WorkSafeBC Registration',
        description: 'Register with WorkSafeBC if you have employees or are self-employed in a high-risk industry.',
        governmentUrl: 'https://www.worksafebc.com/en/insurance/need-coverage/registering-worksafebc',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'corporate_tax',
        title: 'Corporate Income Tax',
        description: 'File T2 corporate tax return. BC corporate tax rate is 12% (combined federal/provincial can be 27%).',
        deadline: '6 months after fiscal year end',
        governmentUrl: 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/corporate',
        isRequired: true,
        appliesTo: ['corporation'],
      },
    ],
  },
  AB: {
    provinceCode: 'AB',
    provinceName: 'Alberta',
    requirements: [
      {
        id: 'gst',
        title: 'GST Registration',
        description: 'Register for GST if annual revenue exceeds $30,000. Alberta has NO PST - only 5% GST.',
        threshold: '$30,000 annual revenue',
        deadline: 'Within 29 days of exceeding threshold',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'payroll',
        title: 'Payroll Deductions Account',
        description: 'Register for payroll deductions if you have employees.',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'wcb',
        title: 'WCB Alberta Registration',
        description: 'Workers\' Compensation Board coverage is required for most employers in Alberta.',
        governmentUrl: 'https://www.wcb.ab.ca/insurance-and-premiums/registering-with-wcb.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'corporate_tax',
        title: 'Corporate Income Tax',
        description: 'File T2 corporate tax return. Alberta has the lowest corporate tax in Canada at 8% (combined 23%).',
        deadline: '6 months after fiscal year end',
        governmentUrl: 'https://www.alberta.ca/corporate-income-tax.aspx',
        isRequired: true,
        appliesTo: ['corporation'],
      },
    ],
  },
  QC: {
    provinceCode: 'QC',
    provinceName: 'Quebec',
    requirements: [
      {
        id: 'gst',
        title: 'GST Registration (TPS)',
        description: 'Register for GST/TPS if annual revenue exceeds $30,000.',
        threshold: '$30,000 annual revenue',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'qst',
        title: 'QST Registration (TVQ)',
        description: 'Register for Quebec Sales Tax (9.975%) with Revenu Québec.',
        threshold: '$30,000 annual revenue',
        governmentUrl: 'https://www.revenuquebec.ca/en/businesses/consumption-taxes/gsthst-and-qst/registering-for-the-gst-and-qst/',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'source_deductions',
        title: 'Source Deductions (Revenu Québec)',
        description: 'Register for Quebec source deductions if you have employees (separate from federal).',
        governmentUrl: 'https://www.revenuquebec.ca/en/businesses/source-deductions-and-contributions/',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'cnesst',
        title: 'CNESST Registration',
        description: 'Commission des normes, de l\'équité, de la santé et de la sécurité du travail - required for most employers.',
        governmentUrl: 'https://www.cnesst.gouv.qc.ca/en/working-conditions/wages/minimum-wage',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'corporate_tax',
        title: 'Corporate Income Tax',
        description: 'File separate Quebec corporate tax return (CO-17). Quebec corporate tax is 11.5%.',
        deadline: '6 months after fiscal year end',
        governmentUrl: 'https://www.revenuquebec.ca/en/businesses/income-tax/',
        isRequired: true,
        appliesTo: ['corporation'],
      },
    ],
  },
  SK: {
    provinceCode: 'SK',
    provinceName: 'Saskatchewan',
    requirements: [
      {
        id: 'gst',
        title: 'GST Registration',
        description: 'Register for GST if annual revenue exceeds $30,000. Saskatchewan uses GST (5%) + PST (6%).',
        threshold: '$30,000 annual revenue',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'pst',
        title: 'PST Vendor Licence',
        description: 'Obtain a PST vendor licence if selling taxable goods or services in Saskatchewan (6% PST).',
        governmentUrl: 'https://www.saskatchewan.ca/business/taxes-licensing-and-reporting/provincial-taxes-policies-and-டிscounts/provincial-sales-tax',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'payroll',
        title: 'Payroll Deductions Account',
        description: 'Register for payroll deductions if you have employees.',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'wcb',
        title: 'WCB Saskatchewan',
        description: 'Workers\' Compensation Board coverage for employers in Saskatchewan.',
        governmentUrl: 'https://www.wcbsask.com/employers/getting-started-employer',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'corporate_tax',
        title: 'Corporate Income Tax',
        description: 'File T2 corporate tax return. Saskatchewan corporate tax is 12% (combined 27%).',
        deadline: '6 months after fiscal year end',
        governmentUrl: 'https://www.saskatchewan.ca/business/taxes-licensing-and-reporting/provincial-taxes-policies-and-discounts/corporation-income-tax',
        isRequired: true,
        appliesTo: ['corporation'],
      },
    ],
  },
  MB: {
    provinceCode: 'MB',
    provinceName: 'Manitoba',
    requirements: [
      {
        id: 'gst',
        title: 'GST Registration',
        description: 'Register for GST if annual revenue exceeds $30,000. Manitoba uses GST (5%) + RST (7%).',
        threshold: '$30,000 annual revenue',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/gst-hst-businesses/register-gst-hst.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'rst',
        title: 'RST Vendor Registration',
        description: 'Register for Retail Sales Tax (7%) if selling taxable goods in Manitoba.',
        governmentUrl: 'https://www.gov.mb.ca/finance/taxation/taxes/retail.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'payroll',
        title: 'Payroll Deductions Account',
        description: 'Register for payroll deductions if you have employees.',
        governmentUrl: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll.html',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'wcb',
        title: 'WCB Manitoba',
        description: 'Workers Compensation Board coverage required for most Manitoba employers.',
        governmentUrl: 'https://www.wcb.mb.ca/registering-with-the-wcb',
        isRequired: true,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'hpl',
        title: 'Health and Education Levy',
        description: 'Pay Health and Post Secondary Education Tax Levy if annual payroll exceeds $2.25 million.',
        threshold: '$2,250,000 annual payroll',
        governmentUrl: 'https://www.gov.mb.ca/finance/taxation/taxes/hel.html',
        isRequired: false,
        appliesTo: ['sole_proprietorship', 'partnership', 'corporation'],
      },
      {
        id: 'corporate_tax',
        title: 'Corporate Income Tax',
        description: 'File T2 corporate tax return. Manitoba corporate tax is 12% (combined 27%).',
        deadline: '6 months after fiscal year end',
        governmentUrl: 'https://www.gov.mb.ca/finance/taxation/taxes/corp.html',
        isRequired: true,
        appliesTo: ['corporation'],
      },
    ],
  },
};

// Get requirements for a specific province and business structure
export function getTaxRequirements(
  provinceCode: string,
  businessStructure: 'sole_proprietorship' | 'partnership' | 'corporation'
): TaxRequirement[] {
  const provinceData = taxRequirementsByProvince[provinceCode];
  if (!provinceData) return [];
  
  return provinceData.requirements.filter(req => 
    req.appliesTo.includes(businessStructure)
  );
}
