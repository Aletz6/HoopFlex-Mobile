export default class RoutineModel {
  constructor({ _id, idUsuario, category, exercise }) {
    this._id = _id;
    this.idUsuario = idUsuario || null;
    this.category = category;
    this.name = exercise?.name || "Sin nombre";
    this.level = exercise?.level || "Desconocido";
    this.duration = exercise?.duration || "0 min";
    this.steps = exercise?.steps || [];
    this.message = exercise?.message || "";
    this.isCustom = !!idUsuario;
  }
}
