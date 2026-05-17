import { User } from "../models/User.js";

const teamPopulation = "name totalSpice totalStreak members";

export class UserRepository {
  create(data) {
    return User.create({
      ...data,
      email: String(data.email || "").trim().toLowerCase()
    });
  }

  findByEmail(email) {
    return User.findOne({ email: String(email || "").trim().toLowerCase() });
  }

  findByGoogleId(googleId) {
    return User.findOne({ googleId });
  }

  findById(id) {
    return User.findById(id).populate("team", teamPopulation);
  }

  updateById(id, update) {
    return User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true
    }).populate("team", teamPopulation);
  }

  listTopUsers(limit = 10) {
    return User.find({})
      .select("name email avatarUrl totalSpice focusStreak currentRank targetRole team")
      .populate("team", "name")
      .sort({ totalSpice: -1, focusStreak: -1, createdAt: 1 })
      .limit(limit);
  }

  async replaceSkillLevel(userId, skillName, level) {
    const user = await User.findById(userId);
    if (!user) return null;

    const existingSkill = user.skills.find(
      (skill) => skill.name.toLowerCase() === skillName.toLowerCase()
    );

    if (existingSkill) {
      existingSkill.level = Math.max(existingSkill.level, level);
    } else {
      user.skills.push({ name: skillName, level });
    }

    await user.save();
    return user;
  }
}
