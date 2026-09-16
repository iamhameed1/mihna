import { t } from "./index";

export function localizeInvalidField(event) {
  const field = event.target;
  if (!field.validity || !field.setCustomValidity) return;
  field.setCustomValidity("");
  const validity = field.validity;
  let key = "Please check the entered information.";
  if (validity.valueMissing) key = "This field is required.";
  else if (validity.typeMismatch) key = field.type === "email" ? "Enter a valid email address." : "Enter a valid URL.";
  else if (validity.patternMismatch) key = "Check the format of this field.";
  field.setCustomValidity(t(key));
}

export function clearFieldValidity(event) {
  event.target.setCustomValidity?.("");
}
