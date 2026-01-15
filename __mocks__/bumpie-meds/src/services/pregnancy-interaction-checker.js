/**
 * Mock for pregnancy-interaction-checker
 */
class PregnancyInteractionChecker {
  async checkPregnancyInteractions() {
    return {
      hasInteractions: false,
      interactions: []
    };
  }
}

module.exports = PregnancyInteractionChecker;
