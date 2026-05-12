import { MentatService } from "../services/mentatService.js";

const mentatService = new MentatService();

export class MentatController {
  async analyze(req, res) {
    const analysis = await mentatService.analyze(req.user, req.body);
    res.json({ success: true, data: analysis });
  }
}
