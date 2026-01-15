/**
 * Mock for pregnancy-risk-calculator
 */
class PregnancyRiskCalculator {
  calculateRisk() {
    return {
      riskScore: 25,
      riskLevel: 'low'
    };
  }
}

module.exports = PregnancyRiskCalculator;
