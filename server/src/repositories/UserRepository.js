import { User } from "../models/User.js";

const teamPopulation = "name totalSpice totalStreak";

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

  findById(id, options = {}) {
    const query = User.findById(id).populate("team", teamPopulation);
    return options.session ? query.session(options.session) : query;
  }

  updateById(id, update, options = {}) {
    return User.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
      ...options
    }).populate("team", teamPopulation);
  }

  addSpice(id, amount, update = {}, options = {}) {
    return User.findByIdAndUpdate(id, { $inc: { totalSpice: amount }, $set: update }, {
      new: true, runValidators: true, ...options
    }).populate("team", teamPopulation);
  }

  listTopUsers(limit = 10) {
    return User.find({})
      .select("name avatarUrl totalSpice focusStreak currentRank targetRole team")
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
