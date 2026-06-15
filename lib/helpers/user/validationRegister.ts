import { userRegister } from "../../types/definitions";
import { Role } from "@/lib/types/definitions";

export function validateUser(input: userRegister) {
  const errors: Record<string, string> = {};

  // name: obligatorio, 2-100 caracteres
  if (!input.fullName || input.fullName.trim().length < 5) {
    errors.fullName =
      "El nombre es obligatorio y debe tener al menos 5 caracteres.";
  }

  // dni: obligatorio, solo números, 7-10 dígitos
  if (!input.dni || !/^\d{7,10}$/.test(input.dni)) {
    errors.dni =
      "El DNI es obligatorio y debe contener solo números (7-10 dígitos).";
  }

  // phone: obligatorio, solo números, puede iniciar con +
  if (!input.phone || !/^\+?\d{7,15}$/.test(input.phone)) {
    errors.phone =
      "El teléfono es obligatorio y debe contener solo números (7-15 dígitos), opcionalmente con + al inicio.";
  }

  // address: obligatorio, máximo 100 caracteres
  if (
    !input.address ||
    input.address.trim().length === 0 ||
    input.address.length > 100
  ) {
    errors.address =
      "La dirección es obligatoria y no debe superar 100 caracteres.";
  }

  // password: obligatorio, mínimo 8 caracteres, al menos una mayúscula y un número
  if (!input.password || input.password.length < 8) {
    errors.password =
      "La contraseña es obligatoria y debe tener al menos 8 caracteres.";
  } else if (!/[A-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    errors.password =
      "La contraseña debe contener al menos una letra mayúscula y un número.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateAdmin(input: {
  username: string;
  password: string;
  fullName: string;
  role: Role;
}) {
  const errors: Record<string, string> = {};

  // fullName: obligatorio, 2-100 caracteres
  if (!input.fullName || input.fullName.trim().length < 5) {
    errors.fullName =
      "El nombre es obligatorio y debe tener al menos 5 caracteres.";
  }

  // fullName: que tenga almenos un espacio (name y lastName)
  if (!input.fullName.includes(" ")) {
    errors.fullName = "Debes ingresar tu nombre y apellido";
  }

  // username: obligatorio, mínimo 3 caracteres
  if (!input.username || input.username.trim().length < 3) {
    errors.username =
      "El nombre de usuario es obligatorio y debe tener al menos 3 caracteres.";
  }

  // password: obligatorio, mínimo 8 caracteres, al menos una mayúscula y un número
  if (!input.password || input.password.length < 8) {
    errors.password =
      "La contraseña es obligatoria y debe tener al menos 8 caracteres.";
  } else if (!/[A-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    errors.password =
      "La contraseña debe contener al menos una letra mayúscula y un número.";
  }

  // role: obligatorio
  if (!input.role) {
    errors.role = "El rol es obligatorio.";
  }

  if (!Object.values(Role).includes(input.role)) {
    errors.role = "El rol no es valido.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
