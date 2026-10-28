export function serializeService(service) {
  const { _id, ...rest } = service;
  return { id: _id.toString(), ...rest };
}

export function serializeMessage(message) {
  const { _id, ...rest } = message;
  return { id: _id.toString(), ...rest };
}
