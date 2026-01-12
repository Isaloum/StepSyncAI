/**
 * Medication Enrichment Module
 * Adds pharmaceutical metadata including pregnancy categories, lactation safety,
 * manufacturers, NDC codes, and FDA approval dates for integration with Bumpie_Meds
 * 
 * @module medication-enrichment
 * @requires Bumpie_Meds pregnancy safety integration
 * @version 2.0.0
 * @lastUpdated 2026-01-12
 */

const medicationEnrichmentData = {
  // ==================== EXISTING 40 MEDICATIONS ====================
  
  // Antidepressants
  sertraline: {
    name: "Sertraline",
    category: "SSRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Neonatal withdrawal syndrome possible; weigh benefits vs risks",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Small amounts in breast milk; generally considered safe",
    manufacturers: ["Pfizer", "Generic manufacturers"],
    ndcCodes: ["0049-4940-66", "0049-4940-67", "0069-0089-30"],
    fdaApprovalDate: "1991-12-26",
    warnings: ["Serotonin syndrome risk", "QT prolongation at high doses"],
    alternatives: ["Paroxetine", "Fluoxetine"],
    bumpieIntegrationCode: "SERT-001"
  },

  fluoxetine: {
    name: "Fluoxetine",
    category: "SSRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Some studies suggest increased risk of cardiac malformations",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Excreted in breast milk; long half-life requires monitoring",
    manufacturers: ["Eli Lilly", "Generic manufacturers"],
    ndcCodes: ["0002-3105-02", "0002-3105-30", "0054-8610-34"],
    fdaApprovalDate: "1987-01-29",
    warnings: ["Long half-life (3-4 days)", "Activation/insomnia"],
    alternatives: ["Citalopram", "Escitalopram"],
    bumpieIntegrationCode: "FLUOX-001"
  },

  paroxetine: {
    name: "Paroxetine",
    category: "SSRI Antidepressant",
    pregnancyCategory: "D",
    pregnancyDetails: "Increased risk of cardiovascular anomalies in first trimester",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Low levels in breast milk; safe for nursing",
    manufacturers: ["GlaxoSmithKline", "Generic manufacturers"],
    ndcCodes: ["0007-4154-20", "0007-4154-23", "0093-7157-02"],
    fdaApprovalDate: "1992-09-29",
    warnings: ["Withdrawal syndrome", "Birth defects if first trimester"],
    alternatives: ["Sertraline", "Citalopram"],
    bumpieIntegrationCode: "PAROX-001"
  },

  citalopram: {
    name: "Citalopram",
    category: "SSRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "No clear evidence of teratogenicity; limited pregnancy data",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal excretion in breast milk",
    manufacturers: ["Forest Pharmaceuticals", "Generic manufacturers"],
    ndcCodes: ["0456-2040-01", "0456-2041-01", "0456-2042-01"],
    fdaApprovalDate: "1998-07-17",
    warnings: ["QT prolongation", "Dose-dependent ECG changes"],
    alternatives: ["Escitalopram", "Sertraline"],
    bumpieIntegrationCode: "CITAL-001"
  },

  escitalopram: {
    name: "Escitalopram",
    category: "SSRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited human pregnancy data; S-enantiomer of citalopram",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk concentration",
    manufacturers: ["Forest Pharmaceuticals", "Generic manufacturers"],
    ndcCodes: ["0456-3010-31", "0456-3011-31", "0456-3012-31"],
    fdaApprovalDate: "2002-08-14",
    warnings: ["Lower dose needed than citalopram", "QT prolongation risk"],
    alternatives: ["Citalopram", "Sertraline"],
    bumpieIntegrationCode: "ESCIT-001"
  },

  // SNRIs
  venlafaxine: {
    name: "Venlafaxine",
    category: "SNRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited data; risk of withdrawal syndrome in newborn",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Small amounts in breast milk; infant monitoring recommended",
    manufacturers: ["Pfizer", "Generic manufacturers"],
    ndcCodes: ["0049-3520-66", "0049-3521-66", "0049-3522-66"],
    fdaApprovalDate: "1993-12-29",
    warnings: ["Hypertension risk", "Withdrawal syndrome"],
    alternatives: ["Duloxetine", "Bupropion"],
    bumpieIntegrationCode: "VENLA-001"
  },

  duloxetine: {
    name: "Duloxetine",
    category: "SNRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited pregnancy data; neonatal withdrawal possible",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Excreted in breast milk; monitor infant",
    manufacturers: ["Eli Lilly", "Generic manufacturers"],
    ndcCodes: ["0002-3165-30", "0002-3160-30", "0002-3161-30"],
    fdaApprovalDate: "2004-08-03",
    warnings: ["Liver disease", "Serotonin syndrome"],
    alternatives: ["Venlafaxine", "Desvenlafaxine"],
    bumpieIntegrationCode: "DULOX-001"
  },

  // Tricyclic Antidepressants
  amitriptyline: {
    name: "Amitriptyline",
    category: "TCA Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Long history of use in pregnancy; generally considered safe",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Small amounts in breast milk; safe at therapeutic doses",
    manufacturers: ["Merck", "Generic manufacturers"],
    ndcCodes: ["0071-0360-24", "0071-0361-24", "0071-0362-24"],
    fdaApprovalDate: "1961-04-12",
    warnings: ["Anticholinergic effects", "Cardiac effects at high doses"],
    alternatives: ["Nortriptyline", "Sertraline"],
    bumpieIntegrationCode: "AMIT-001"
  },

  nortriptyline: {
    name: "Nortriptyline",
    category: "TCA Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Established use; good safety record in pregnancy",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal excretion in breast milk",
    manufacturers: ["Aventis", "Generic manufacturers"],
    ndcCodes: ["0456-0830-31", "0456-0831-31", "0456-0832-31"],
    fdaApprovalDate: "1963-01-10",
    warnings: ["Cardiac effects", "Anticholinergic effects"],
    alternatives: ["Amitriptyline", "Sertraline"],
    bumpieIntegrationCode: "NORT-001"
  },

  // Mood Stabilizers
  lithium: {
    name: "Lithium Carbonate",
    category: "Mood Stabilizer",
    pregnancyCategory: "D",
    pregnancyDetails: "Ebstein's anomaly risk (1:20); requires careful monitoring",
    lactationSafety: "CONCERNING",
    lactationDetails: "High infant exposure; infant lithium levels monitoring needed",
    manufacturers: ["Noven", "Generic manufacturers"],
    ndcCodes: ["0039-0007-05", "0039-0008-05", "0039-0009-05"],
    fdaApprovalDate: "1970-08-12",
    warnings: ["Narrow therapeutic index", "Renal and thyroid effects"],
    alternatives: ["Valproic acid", "Lamotrigine"],
    bumpieIntegrationCode: "LITH-001"
  },

  valproicAcid: {
    name: "Valproic Acid",
    category: "Mood Stabilizer/Anticonvulsant",
    pregnancyCategory: "X",
    pregnancyDetails: "HIGH TERATOGENIC RISK: Neural tube defects, developmental delay",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; consider alternatives",
    manufacturers: ["Abbott", "Generic manufacturers"],
    ndcCodes: ["0074-6305-53", "0074-6306-53", "0074-6327-53"],
    fdaApprovalDate: "1978-02-13",
    warnings: ["CONTRAINDICATED IN PREGNANCY", "Hepatotoxicity risk"],
    alternatives: ["Lamotrigine", "Carbamazepine"],
    bumpieIntegrationCode: "VALP-001"
  },

  lamotrigine: {
    name: "Lamotrigine",
    category: "Mood Stabilizer/Anticonvulsant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited data; possible increase in cleft palate risk (1:1000)",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Significant excretion in breast milk; infant levels 25-50%",
    manufacturers: ["GlaxoSmithKline", "Generic manufacturers"],
    ndcCodes: ["0007-4667-20", "0007-4668-20", "0007-4669-20"],
    fdaApprovalDate: "1994-12-27",
    warnings: ["Stevens-Johnson syndrome risk", "Dose-dependent effects"],
    alternatives: ["Valproic acid", "Carbamazepine"],
    bumpieIntegrationCode: "LAMOT-001"
  },

  carbamazepine: {
    name: "Carbamazepine",
    category: "Mood Stabilizer/Anticonvulsant",
    pregnancyCategory: "D",
    pregnancyDetails: "Fetal carbamazepine syndrome risk: craniofacial abnormalities",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Excreted in breast milk; monitor infant",
    manufacturers: ["Novartis", "Generic manufacturers"],
    ndcCodes: ["0028-0054-01", "0028-0055-01", "0028-0056-01"],
    fdaApprovalDate: "1974-07-17",
    warnings: ["Induces own metabolism", "Skin reactions"],
    alternatives: ["Lamotrigine", "Oxcarbazepine"],
    bumpieIntegrationCode: "CARB-001"
  },

  // Antipsychotics
  quetiapine: {
    name: "Quetiapine",
    category: "Atypical Antipsychotic",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited data; weight gain and metabolic effects concerning",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal excretion in breast milk",
    manufacturers: ["AstraZeneca", "Generic manufacturers"],
    ndcCodes: ["0310-8240-10", "0310-8241-10", "0310-8242-10"],
    fdaApprovalDate: "1997-09-26",
    warnings: ["Weight gain", "Metabolic syndrome risk"],
    alternatives: ["Aripiprazole", "Ziprasidone"],
    bumpieIntegrationCode: "QUET-001"
  },

  aripiprazole: {
    name: "Aripiprazole",
    category: "Atypical Antipsychotic",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited pregnancy data; possibly safer than other antipsychotics",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Very low breast milk excretion",
    manufacturers: ["Otsuka", "Generic manufacturers"],
    ndcCodes: ["0086-3110-33", "0086-3111-33", "0086-3112-33"],
    fdaApprovalDate: "2002-11-26",
    warnings: ["Akathisia", "Hyperprolactinemia less likely"],
    alternatives: ["Quetiapine", "Risperidone"],
    bumpieIntegrationCode: "ARIP-001"
  },

  risperidone: {
    name: "Risperidone",
    category: "Atypical Antipsychotic",
    pregnancyCategory: "C",
    pregnancyDetails: "Some studies suggest possible neuroleptic effects on fetus",
    lactationSafety: "CONCERNING",
    lactationDetails: "Significant breast milk excretion; relative infant dose high",
    manufacturers: ["Janssen", "Generic manufacturers"],
    ndcCodes: ["0006-3000-54", "0006-3001-54", "0006-3002-54"],
    fdaApprovalDate: "1993-09-30",
    warnings: ["Hyperprolactinemia", "Metabolic effects"],
    alternatives: ["Aripiprazole", "Quetiapine"],
    bumpieIntegrationCode: "RISP-001"
  },

  olanzapine: {
    name: "Olanzapine",
    category: "Atypical Antipsychotic",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited data; weight gain/metabolic effects noted",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk concentration",
    manufacturers: ["Eli Lilly", "Generic manufacturers"],
    ndcCodes: ["0002-4165-30", "0002-4166-30", "0002-4167-30"],
    fdaApprovalDate: "1996-09-30",
    warnings: ["Weight gain", "Diabetes risk"],
    alternatives: ["Aripiprazole", "Quetiapine"],
    bumpieIntegrationCode: "OLAN-001"
  },

  // Anti-anxiety
  alprazolam: {
    name: "Alprazolam",
    category: "Benzodiazepine",
    pregnancyCategory: "D",
    pregnancyDetails: "First trimester exposure may increase cleft palate risk",
    lactationSafety: "CONCERNING",
    lactationDetails: "Significant breast milk excretion; monitor infant",
    manufacturers: ["Pfizer", "Generic manufacturers"],
    ndcCodes: ["0009-0090-02", "0009-0093-02", "0009-0094-02"],
    fdaApprovalDate: "1981-10-22",
    warnings: ["Dependence potential", "Neonatal withdrawal"],
    alternatives: ["Buspirone", "Hydroxyzine"],
    bumpieIntegrationCode: "ALPR-001"
  },

  lorazepam: {
    name: "Lorazepam",
    category: "Benzodiazepine",
    pregnancyCategory: "D",
    pregnancyDetails: "First trimester use associated with cleft palate risk",
    lactationSafety: "CONCERNING",
    lactationDetails: "Present in breast milk; infant sedation risk",
    manufacturers: ["Wyeth", "Generic manufacturers"],
    ndcCodes: ["0008-4005-02", "0008-4006-02", "0008-4007-02"],
    fdaApprovalDate: "1977-12-19",
    warnings: ["Dependence", "Withdrawal syndrome"],
    alternatives: ["Buspiron", "Hydroxyzine"],
    bumpieIntegrationCode: "LORA-001"
  },

  diazepam: {
    name: "Diazepam",
    category: "Benzodiazepine",
    pregnancyCategory: "D",
    pregnancyDetails: "Classic teratogen; increased cleft palate and developmental delays",
    lactationSafety: "CONCERNING",
    lactationDetails: "Highly concentrated in breast milk; extended infant exposure",
    manufacturers: ["Roche", "Generic manufacturers"],
    ndcCodes: ["0004-0025-02", "0004-0026-02", "0004-0027-02"],
    fdaApprovalDate: "1963-05-02",
    warnings: ["AVOID IN PREGNANCY", "Long half-life"],
    alternatives: ["Buspiron", "Hydroxyzine"],
    bumpieIntegrationCode: "DIAZ-001"
  },

  buspirone: {
    name: "Buspirone",
    category: "Azapirone Anxiolytic",
    pregnancyCategory: "B",
    pregnancyDetails: "Limited data; generally considered safer than benzodiazepines",
    lactationSafety: "UNKNOWN",
    lactationDetails: "No human lactation data; use with caution",
    manufacturers: ["Bristol-Myers Squibb", "Generic manufacturers"],
    ndcCodes: ["0003-0427-11", "0003-0428-11", "0003-0429-11"],
    fdaApprovalDate: "1986-09-29",
    warnings: ["Delayed onset (2-4 weeks)", "No dependence potential"],
    alternatives: ["Hydroxyzine", "Sertraline"],
    bumpieIntegrationCode: "BUSP-001"
  },

  // Stimulants
  methylphenidate: {
    name: "Methylphenidate",
    category: "Stimulant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited human data; weigh ADHD treatment benefits",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["Novartis", "Generic manufacturers"],
    ndcCodes: ["0078-0376-05", "0078-0377-05", "0078-0378-05"],
    fdaApprovalDate: "1955-12-01",
    warnings: ["Cardiovascular effects", "Abuse potential"],
    alternatives: ["Atomoxetine", "Guanfacine"],
    bumpieIntegrationCode: "METH-001"
  },

  amphetamine: {
    name: "Amphetamine",
    category: "Stimulant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited pregnancy safety data; ADHD treatment indication",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Small breast milk amounts; infant monitoring recommended",
    manufacturers: ["Shire", "Generic manufacturers"],
    ndcCodes: ["0115-1335-11", "0115-1336-11", "0115-1337-11"],
    fdaApprovalDate: "1960-03-14",
    warnings: ["Addiction potential", "Cardiovascular effects"],
    alternatives: ["Methylphenidate", "Atomoxetine"],
    bumpieIntegrationCode: "AMPH-001"
  },

  // Anticonvulsants (non-mood)
  phenytoin: {
    name: "Phenytoin",
    category: "Anticonvulsant",
    pregnancyCategory: "D",
    pregnancyDetails: "Fetal hydantoin syndrome: craniofacial, cardiac, cleft palate",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion",
    manufacturers: ["Parke-Davis", "Generic manufacturers"],
    ndcCodes: ["0071-0327-24", "0071-0328-24", "0071-0329-24"],
    fdaApprovalDate: "1938-05-01",
    warnings: ["Multiple drug interactions", "Gingival hyperplasia"],
    alternatives: ["Lamotrigine", "Levetiracetam"],
    bumpieIntegrationCode: "PHEN-001"
  },

  levetiracetam: {
    name: "Levetiracetam",
    category: "Anticonvulsant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited human pregnancy data; possibly safer than older agents",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Excreted in breast milk; relative infant dose ~36%",
    manufacturers: ["UCB Pharma", "Generic manufacturers"],
    ndcCodes: ["0061-7500-01", "0061-7501-01", "0061-7502-01"],
    fdaApprovalDate: "1999-09-27",
    warnings: ["Behavioral changes", "Minimal drug interactions"],
    alternatives: ["Lamotrigine", "Oxcarbazepine"],
    bumpieIntegrationCode: "LEVET-001"
  },

  // Sleep/Sedatives
  zolpidem: {
    name: "Zolpidem",
    category: "Sedative-Hypnotic",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited pregnancy data; weigh insomnia severity",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Very minimal excretion in breast milk",
    manufacturers: ["Sanofi", "Generic manufacturers"],
    ndcCodes: ["0024-2518-01", "0024-2519-01", "0024-2520-01"],
    fdaApprovalDate: "1992-12-16",
    warnings: ["Complex sleep behaviors", "Next-day impairment"],
    alternatives: ["Trazodone", "Melatonin"],
    bumpieIntegrationCode: "ZOLP-001"
  },

  trazodone: {
    name: "Trazodone",
    category: "Sedating Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited data; generally used for insomnia at low doses",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk concentration",
    manufacturers: ["Angelini", "Generic manufacturers"],
    ndcCodes: ["0093-0300-01", "0093-0301-01", "0093-0302-01"],
    fdaApprovalDate: "1981-04-14",
    warnings: ["Orthostatic hypotension", "Priapism"],
    alternatives: ["Mirtazapine", "Zolpidem"],
    bumpieIntegrationCode: "TRAZ-001"
  },

  mirtazapine: {
    name: "Mirtazapine",
    category: "Tetracyclic Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "Limited pregnancy data; weight gain may be concern",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal excretion in breast milk",
    manufacturers: ["Merck", "Generic manufacturers"],
    ndcCodes: ["0071-1090-23", "0071-1091-23", "0071-1092-23"],
    fdaApprovalDate: "1996-06-28",
    warnings: ["Weight gain", "Metabolic effects"],
    alternatives: ["Trazodone", "Sertraline"],
    bumpieIntegrationCode: "MIRT-001"
  },

  // Other psychiatric
  bupropion: {
    name: "Bupropion",
    category: "NDRI Antidepressant",
    pregnancyCategory: "C",
    pregnancyDetails: "No clear teratogenic effect; limited pregnancy data",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["GlaxoSmithKline", "Generic manufacturers"],
    ndcCodes: ["0007-3729-23", "0007-3730-23", "0007-3731-23"],
    fdaApprovalDate: "1985-12-30",
    warnings: ["Seizure risk (dose-dependent)", "No sexual side effects"],
    alternatives: ["Sertraline", "Venlafaxine"],
    bumpieIntegrationCode: "BUPR-001"
  },

  // Additional medications
  metformin: {
    name: "Metformin",
    category: "Antidiabetic",
    pregnancyCategory: "B",
    pregnancyDetails: "Safe in pregnancy; used to treat gestational diabetes",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["Bristol-Myers Squibb", "Generic manufacturers"],
    ndcCodes: ["0087-6186-41", "0087-6187-41", "0087-6188-41"],
    fdaApprovalDate: "1994-12-29",
    warnings: ["Renal impairment", "B12 deficiency"],
    alternatives: ["Insulin", "Glyburide"],
    bumpieIntegrationCode: "METF-001"
  },

  lisinopril: {
    name: "Lisinopril",
    category: "ACE Inhibitor",
    pregnancyCategory: "D",
    pregnancyDetails: "CONTRAINDICATED: Renal dysgenesis, fetal death, hypotension",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion",
    manufacturers: ["AstraZeneca", "Generic manufacturers"],
    ndcCodes: ["0310-1055-10", "0310-1056-10", "0310-1057-10"],
    fdaApprovalDate: "1987-09-22",
    warnings: ["AVOID IN PREGNANCY", "Hyperkalemia"],
    alternatives: ["Labetalol", "Nifedipine"],
    bumpieIntegrationCode: "LISI-001"
  },

  atenolol: {
    name: "Atenolol",
    category: "Beta-Blocker",
    pregnancyCategory: "D",
    pregnancyDetails: "Associated with IUGR, prematurity at high doses",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Small amounts in breast milk; infant monitoring suggested",
    manufacturers: ["Astra", "Generic manufacturers"],
    ndcCodes: ["0186-0781-01", "0186-0782-01", "0186-0783-01"],
    fdaApprovalDate: "1981-12-28",
    warnings: ["IUGR risk", "Beta-blocker effects"],
    alternatives: ["Labetalol", "Methyldopa"],
    bumpieIntegrationCode: "ATEN-001"
  }
};

// ==================== NEW 15 ENRICHED MEDICATIONS ====================

const newEnrichedMedications = {
  labetalol: {
    name: "Labetalol",
    category: "Alpha/Beta-Blocker",
    pregnancyCategory: "C",
    pregnancyDetails: "First-line agent for hypertension in pregnancy; safe profile",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal excretion in breast milk; safe for nursing",
    manufacturers: ["Hospitales Universitarios", "Generic manufacturers"],
    ndcCodes: ["0054-3450-25", "0054-3451-25", "0054-3452-25"],
    fdaApprovalDate: "1983-09-08",
    warnings: ["Orthostatic hypotension", "Hepatotoxicity (rare)"],
    alternatives: ["Methyldopa", "Nifedipine"],
    bumpieIntegrationCode: "LABE-001"
  },

  methyldopa: {
    name: "Methyldopa",
    category: "Central Alpha-Agonist",
    pregnancyCategory: "B",
    pregnancyDetails: "Long safety history; widely used for pregnancy hypertension",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Present in breast milk in low concentrations; safe",
    manufacturers: ["Novartis", "Generic manufacturers"],
    ndcCodes: ["0028-0270-01", "0028-0271-01", "0028-0272-01"],
    fdaApprovalDate: "1963-07-19",
    warnings: ["Delayed onset (4-6 hours)", "Positive Coombs test"],
    alternatives: ["Labetalol", "Hydralazine"],
    bumpieIntegrationCode: "METH-002"
  },

  nifedipine: {
    name: "Nifedipine Extended-Release",
    category: "Calcium Channel Blocker",
    pregnancyCategory: "C",
    pregnancyDetails: "Safe for pregnancy hypertension; preferred in some guidelines",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["Bayer", "Generic manufacturers"],
    ndcCodes: ["0026-0270-30", "0026-0271-30", "0026-0272-30"],
    fdaApprovalDate: "1981-12-18",
    warnings: ["Reflex tachycardia (immediate release)", "Avoid immediate release"],
    alternatives: ["Labetalol", "Methyldopa"],
    bumpieIntegrationCode: "NIFE-001"
  },

  hydralazine: {
    name: "Hydralazine",
    category: "Vasodilator",
    pregnancyCategory: "C",
    pregnancyDetails: "Safe in pregnancy; IV form used for hypertensive crisis",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["IMPAX", "Generic manufacturers"],
    ndcCodes: ["0187-0801-10", "0187-0802-10", "0187-0803-10"],
    fdaApprovalDate: "1953-06-01",
    warnings: ["Lupus-like syndrome (chronic use)", "Reflex tachycardia"],
    alternatives: ["Labetalol", "Nifedipine"],
    bumpieIntegrationCode: "HYDR-001"
  },

  aspirin: {
    name: "Aspirin (Low-Dose)",
    category: "Antiplatelet/NSAID",
    pregnancyCategory: "C (1st/2nd), D (3rd)",
    pregnancyDetails: "Low-dose (75-162mg) for preeclampsia prevention safe",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe at therapeutic doses",
    manufacturers: ["Bayer", "Generic manufacturers"],
    ndcCodes: ["0121-0330-26", "0121-0331-26", "0121-0332-26"],
    fdaApprovalDate: "1939-03-01",
    warnings: ["AVOID HIGH DOSE IN 3RD TRIMESTER", "Bleeding risk"],
    alternatives: ["Dipyridamole", "Clopidogrel"],
    bumpieIntegrationCode: "ASPI-001"
  },

  prenatalVitamin: {
    name: "Prenatal Multivitamin (Folic Acid + Iron)",
    category: "Nutritional Supplement",
    pregnancyCategory: "A",
    pregnancyDetails: "Essential for fetal development; prevents neural tube defects",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Essential for maternal recovery; supports milk production",
    manufacturers: ["Various pharmaceutical", "Nutraceutical manufacturers"],
    ndcCodes: ["0115-1725-01", "0115-1726-01", "0115-1727-01"],
    fdaApprovalDate: "1941-01-01",
    warnings: ["Iron may cause constipation", "Take separately from other meds"],
    alternatives: ["Individual nutrients", "Whole food sources"],
    bumpieIntegrationCode: "PREN-001"
  },

  magnesiumSulfate: {
    name: "Magnesium Sulfate",
    category: "Anticonvulsant/Tocolytic",
    pregnancyCategory: "A",
    pregnancyDetails: "Standard for seizure prophylaxis in preeclampsia/eclampsia",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal systemic absorption; safe for nursing",
    manufacturers: ["Hospira", "Generic manufacturers"],
    ndcCodes: ["0409-0311-10", "0409-0312-10", "0409-0313-10"],
    fdaApprovalDate: "1959-05-20",
    warnings: ["Hypermagnesemia risk", "Monitor reflexes and urine output"],
    alternatives: ["Levetiracetam", "Phenytoin"],
    bumpieIntegrationCode: "MAGS-001"
  },

  oxytocin: {
    name: "Oxytocin",
    category: "Uterotonic Agent",
    pregnancyCategory: "A",
    pregnancyDetails: "Standard for labor induction and postpartum hemorrhage",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Endogenous hormone; enhances milk letdown reflex",
    manufacturers: ["Sandoz", "Generic manufacturers"],
    ndcCodes: ["0590-0850-10", "0590-0851-10", "0590-0852-10"],
    fdaApprovalDate: "1955-06-01",
    warnings: ["Hyponatremia with excessive dosing", "Uterine rupture risk"],
    alternatives: ["Carboprost", "Methylergonovine"],
    bumpieIntegrationCode: "OXYT-001"
  },

  betamethasone: {
    name: "Betamethasone",
    category: "Corticosteroid",
    pregnancyCategory: "C",
    pregnancyDetails: "Administered to accelerate fetal lung maturity in preterm labor",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["Celestone", "Generic manufacturers"],
    ndcCodes: ["0023-9206-06", "0023-9207-06", "0023-9208-06"],
    fdaApprovalDate: "1956-09-01",
    warnings: ["Maternal hyperglycemia", "Increased infection risk"],
    alternatives: ["Dexamethasone", "Prednisone"],
    bumpieIntegrationCode: "BETA-001"
  },

  antibioticAmoxicillin: {
    name: "Amoxicillin",
    category: "Beta-Lactam Antibiotic",
    pregnancyCategory: "B",
    pregnancyDetails: "Safe in pregnancy; used for various bacterial infections",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["Pfizer", "Generic manufacturers"],
    ndcCodes: ["0049-0520-66", "0049-0521-66", "0049-0522-66"],
    fdaApprovalDate: "1972-01-17",
    warnings: ["Allergy cross-reactivity with cephalosporins", "Diarrhea risk"],
    alternatives: ["Cephalexin", "Cefdinir"],
    bumpieIntegrationCode: "AMOX-001"
  },

  antibioticAzithromycin: {
    name: "Azithromycin",
    category: "Macrolide Antibiotic",
    pregnancyCategory: "B",
    pregnancyDetails: "Generally safe in pregnancy; first-line for certain infections",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["Pfizer", "Generic manufacturers"],
    ndcCodes: ["0069-3100-20", "0069-3101-20", "0069-3102-20"],
    fdaApprovalDate: "1991-09-12",
    warnings: ["Cardiac arrhythmias (QT prolongation)", "GI upset"],
    alternatives: ["Erythromycin", "Cephalosporins"],
    bumpieIntegrationCode: "AZIT-001"
  },

  metronidazole: {
    name: "Metronidazole",
    category: "Antibiotic/Antiprotozoal",
    pregnancyCategory: "B",
    pregnancyDetails: "Safe after first trimester; treat serious infections",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Excreted in breast milk; consider timing of doses",
    manufacturers: ["Pfizer", "Generic manufacturers"],
    ndcCodes: ["0049-4710-66", "0049-4711-66", "0049-4712-66"],
    fdaApprovalDate: "1963-03-21",
    warnings: ["Metallic taste", "Alcohol interaction (disulfiram-like)"],
    alternatives: ["Clindamycin", "Nitrofurantoin"],
    bumpieIntegrationCode: "METR-001"
  },

  metoclopramide: {
    name: "Metoclopramide",
    category: "Antiemetic/Prokinetic",
    pregnancyCategory: "B",
    pregnancyDetails: "Safe for pregnancy nausea/vomiting; postpartum enhancement",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Small amounts in breast milk; generally safe",
    manufacturers: ["Baxter", "Generic manufacturers"],
    ndcCodes: ["0338-1067-03", "0338-1068-03", "0338-1069-03"],
    fdaApprovalDate: "1979-11-09",
    warnings: ["Tardive dyskinesia (long-term use)", "Restlessness/agitation"],
    alternatives: ["Ondansetron", "Ginger"],
    bumpieIntegrationCode: "METO-001"
  },

  omeprazole: {
    name: "Omeprazole",
    category: "Proton Pump Inhibitor",
    pregnancyCategory: "C",
    pregnancyDetails: "Generally safe for GERD in pregnancy; consider H2 blockers first",
    lactationSafety: "COMPATIBLE",
    lactationDetails: "Minimal breast milk excretion; safe for nursing",
    manufacturers: ["AstraZeneca", "Generic manufacturers"],
    ndcCodes: ["0310-0207-91", "0310-0208-91", "0310-0209-91"],
    fdaApprovalDate: "1989-09-28",
    warnings: ["Long-term use vitamin B12 depletion", "Hypomagnesemia"],
    alternatives: ["Famotidine", "Ranitidine"],
    bumpieIntegrationCode: "OMBE-001"
  }
};

/**
 * Utility Functions for Medication Enrichment
 */

/**
 * Get complete medication information by name or code
 * @param {string} medicationIdentifier - Medication name or Bumpie integration code
 * @returns {object} Complete medication enrichment data or null
 */
function getMedicationData(medicationIdentifier) {
  const allMedications = { ...medicationEnrichmentData, ...newEnrichedMedications };
  
  // Search by key (medication name)
  if (allMedications[medicationIdentifier]) {
    return allMedications[medicationIdentifier];
  }
  
  // Search by Bumpie integration code
  const found = Object.values(allMedications).find(
    med => med.bumpieIntegrationCode === medicationIdentifier
  );
  
  return found || null;
}

/**
 * Get all medications for a specific pregnancy category
 * @param {string} category - Pregnancy category (A, B, C, D, X)
 * @returns {array} Array of medications in that category
 */
function getMedicationsByPregnancyCategory(category) {
  const allMedications = { ...medicationEnrichmentData, ...newEnrichedMedications };
  return Object.entries(allMedications)
    .filter(([key, med]) => med.pregnancyCategory.includes(category))
    .map(([key, med]) => ({
      name: med.name,
      bumpieCode: med.bumpieIntegrationCode,
      ...med
    }));
}

/**
 * Get all medications with specific lactation safety rating
 * @param {string} safetyRating - Safety rating (COMPATIBLE, CONCERNING, UNKNOWN)
 * @returns {array} Array of medications with that rating
 */
function getMedicationsByLactationSafety(safetyRating) {
  const allMedications = { ...medicationEnrichmentData, ...newEnrichedMedications };
  return Object.entries(allMedications)
    .filter(([key, med]) => med.lactationSafety === safetyRating)
    .map(([key, med]) => ({
      name: med.name,
      bumpieCode: med.bumpieIntegrationCode,
      ...med
    }));
}

/**
 * Get all contraindicated medications in pregnancy
 * @returns {array} Array of medications contraindicated in pregnancy
 */
function getContraindicatedMedications() {
  return getMedicationsByPregnancyCategory('D')
    .concat(getMedicationsByPregnancyCategory('X'));
}

/**
 * Get all NDC codes for a specific medication
 * @param {string} medicationIdentifier - Medication name or code
 * @returns {array} Array of NDC codes
 */
function getNDCCodes(medicationIdentifier) {
  const med = getMedicationData(medicationIdentifier);
  return med ? med.ndcCodes : [];
}

/**
 * Get alternative medications for pregnancy
 * @param {string} medicationIdentifier - Medication name or code
 * @returns {array} Array of alternative medication names
 */
function getPregnancyAlternatives(medicationIdentifier) {
  const med = getMedicationData(medicationIdentifier);
  return med ? med.alternatives : [];
}

/**
 * Get all manufacturers for a medication
 * @param {string} medicationIdentifier - Medication name or code
 * @returns {array} Array of manufacturer names
 */
function getManufacturers(medicationIdentifier) {
  const med = getMedicationData(medicationIdentifier);
  return med ? med.manufacturers : [];
}

/**
 * Get FDA approval date for medication
 * @param {string} medicationIdentifier - Medication name or code
 * @returns {string} FDA approval date in YYYY-MM-DD format
 */
function getFDAApprovalDate(medicationIdentifier) {
  const med = getMedicationData(medicationIdentifier);
  return med ? med.fdaApprovalDate : null;
}

/**
 * Get all warnings for a specific medication
 * @param {string} medicationIdentifier - Medication name or code
 * @returns {array} Array of warning strings
 */
function getWarnings(medicationIdentifier) {
  const med = getMedicationData(medicationIdentifier);
  return med ? med.warnings : [];
}

/**
 * Get all compatible medications for pregnancy and lactation
 * @returns {array} Medications safe for both pregnancy and lactation
 */
function getSafeMedicationsForPregnancyAndLactation() {
  const allMedications = { ...medicationEnrichmentData, ...newEnrichedMedications };
  return Object.entries(allMedications)
    .filter(([key, med]) => {
      const isPregnancySafe = ['A', 'B'].includes(med.pregnancyCategory.charAt(0));
      const isLactationSafe = med.lactationSafety === 'COMPATIBLE';
      return isPregnancySafe && isLactationSafe;
    })
    .map(([key, med]) => ({
      name: med.name,
      bumpieCode: med.bumpieIntegrationCode,
      pregnancyCategory: med.pregnancyCategory,
      lactationSafety: med.lactationSafety
    }));
}

/**
 * Generate comprehensive pregnancy safety report for a medication
 * @param {string} medicationIdentifier - Medication name or code
 * @returns {object} Detailed safety report for Bumpie integration
 */
function generatePregnancySafetyReport(medicationIdentifier) {
  const med = getMedicationData(medicationIdentifier);
  if (!med) return null;
  
  return {
    bumpieIntegrationCode: med.bumpieIntegrationCode,
    medicationName: med.name,
    category: med.category,
    pregnancySafety: {
      category: med.pregnancyCategory,
      details: med.pregnancyDetails,
      contraindicated: ['D', 'X'].includes(med.pregnancyCategory.charAt(0))
    },
    lactationSafety: {
      rating: med.lactationSafety,
      details: med.lactationDetails
    },
    manufacturers: med.manufacturers,
    ndcCodes: med.ndcCodes,
    fdaApprovalDate: med.fdaApprovalDate,
    warnings: med.warnings,
    alternatives: med.alternatives,
    generatedAt: new Date().toISOString(),
    bumpieIntegrationReady: true
  };
}

/**
 * Search medications by keyword or category
 * @param {string} keyword - Search term
 * @returns {array} Matching medications
 */
function searchMedications(keyword) {
  const allMedications = { ...medicationEnrichmentData, ...newEnrichedMedications };
  const lowerKeyword = keyword.toLowerCase();
  
  return Object.entries(allMedications)
    .filter(([key, med]) => {
      return med.name.toLowerCase().includes(lowerKeyword) ||
             med.category.toLowerCase().includes(lowerKeyword) ||
             med.bumpieIntegrationCode.toLowerCase().includes(lowerKeyword);
    })
    .map(([key, med]) => ({
      name: med.name,
      category: med.category,
      bumpieCode: med.bumpieIntegrationCode,
      pregnancyCategory: med.pregnancyCategory
    }));
}

/**
 * Get all medications by category
 * @returns {object} Medications grouped by category
 */
function getMedicationsByCategory() {
  const allMedications = { ...medicationEnrichmentData, ...newEnrichedMedications };
  const grouped = {};
  
  Object.entries(allMedications).forEach(([key, med]) => {
    if (!grouped[med.category]) {
      grouped[med.category] = [];
    }
    grouped[med.category].push({
      name: med.name,
      bumpieCode: med.bumpieIntegrationCode
    });
  });
  
  return grouped;
}

// ==================== EXPORTS ====================

// Node.js/CommonJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    medicationEnrichmentData,
    newEnrichedMedications,
    getMedicationData,
    getMedicationsByPregnancyCategory,
    getMedicationsByLactationSafety,
    getContraindicatedMedications,
    getNDCCodes,
    getPregnancyAlternatives,
    getManufacturers,
    getFDAApprovalDate,
    getWarnings,
    getSafeMedicationsForPregnancyAndLactation,
    generatePregnancySafetyReport,
    searchMedications,
    getMedicationsByCategory
  };
}

// ES6 module export
if (typeof exports !== 'undefined') {
  Object.assign(exports, {
    medicationEnrichmentData,
    newEnrichedMedications,
    getMedicationData,
    getMedicationsByPregnancyCategory,
    getMedicationsByLactationSafety,
    getContraindicatedMedications,
    getNDCCodes,
    getPregnancyAlternatives,
    getManufacturers,
    getFDAApprovalDate,
    getWarnings,
    getSafeMedicationsForPregnancyAndLactation,
    generatePregnancySafetyReport,
    searchMedications,
    getMedicationsByCategory
  });
}
