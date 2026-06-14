import { obtenerLogrosYDesbloqueados } from "../services/api";
import { getCurrentUserId } from "../services/FirebaseService";

class AchievementsViewModel {
  async getAchievementsData(userId) {
    try {
      const achievements = await obtenerLogrosYDesbloqueados(userId);
      const days = this.getConsecutiveDaysFromAchievements(achievements);
      const ranks = this.getRanks(achievements);
      return { achievements, days, ranks };
    } catch (error) {
      console.error("Error cargando logros:", error);
      return { achievements: [], days: 0, ranks: {} };
    }
  }

  async loadForCurrentUser() {
    try {
      const userId = getCurrentUserId();
      if (!userId) return { grouped: {}, days: 0, ranks: {}, achievements: [] };
      const { achievements, days, ranks } = await this.getAchievementsData(userId);
      const grouped = this.groupByCategory(achievements);
      return { grouped, days, ranks, achievements };
    } catch (error) {
      console.error("Error loading achievements for current user:", error);
      return { grouped: {}, days: 0, ranks: {}, achievements: [] };
    }
  }

  groupByCategory(achievements) {
    return achievements.reduce((acc, logro) => {
      if (!acc[logro.category]) acc[logro.category] = [];
      acc[logro.category].push(logro);
      return acc;
    }, {});
  }

  getConsecutiveDaysFromAchievements(achievements) {
    const dates = achievements
      .filter(a => a.unlocked && a.date)
      .map(a => a.date?.slice(0, 10));

    const uniqueDates = [...new Set(dates)].sort();
    if (uniqueDates.length === 0) return 0;

    let max = 1, streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      if ((curr - prev) / (1000 * 60 * 60 * 24) === 1) {
        streak++;
        max = Math.max(max, streak);
      } else {
        streak = 1;
      }
    }
    return max;
  }

  getRanks(achievements) {
    const categories = ["Dribble", "Shooting", "Agility"];
    const ranks = {};
    const rankNames = [
      { count: 0, name: "Unranked" },
      { count: 1, name: "Novice" },
      { count: 3, name: "Intermediate" },
      { count: 5, name: "Advanced" },
      { count: 7, name: "Pro" },
    ];

    for (const cat of categories) {
      const unlocked = achievements.filter(a => a.category === cat && a.unlocked).length;
      ranks[cat] = rankNames.reduce((acc, r) => unlocked >= r.count ? r.name : acc, "Unranked");
    }

    const totalUnlocked = achievements.filter(a => a.unlocked).length;
    if (totalUnlocked >= 21) ranks.general = "Diamond";
    else if (totalUnlocked >= 15) ranks.general = "Platinum";
    else if (totalUnlocked >= 10) ranks.general = "Gold";
    else if (totalUnlocked >= 6) ranks.general = "Silver";
    else if (totalUnlocked >= 3) ranks.general = "Bronze";
    else ranks.general = "Unranked";

    return ranks;
  }
}

export default new AchievementsViewModel();
