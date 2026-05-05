import { RoadmapPlan } from "../models/RoadmapPlan.js";

export class RoadmapRepository {
  create(data) {
    return RoadmapPlan.create(data);
  }

  findByUser(userId) {
    return RoadmapPlan.findOne({ user: userId });
  }

  async save(roadmap) {
    await roadmap.save();
    return roadmap;
  }
}
