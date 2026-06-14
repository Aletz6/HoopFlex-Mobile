export class TrainingLogModel {
  constructor({ id, idUsuario, title, date, duration, routineLevel, routineCategory, steps = [] }) {
    this.id = id;
    this.idUsuario = idUsuario;
    this.title = title;
    this.date = date;
    this.duration = duration;
    this.routineLevel = routineLevel;
    this.routineCategory = routineCategory;
    this.steps = steps.map((step, index) => ({
      id: step.id || `${index + 1}`,
      name: step.name || "",
      sets: step.sets || 0,
      reps: step.reps || 0,
    }));
  }
}

