export function serializeService(service) {
  const { _id, ...rest } = service;
  return { id: _id.toString(), ...rest };
}

export function serializeMessage(message) {
  const { _id, ...rest } = message;
  return { id: _id.toString(), ...rest };
}

export function serializeSubject(subject) {
  const { _id, userId, ...rest } = subject;
  return { id: _id.toString(), ...rest };
}

export function serializeTask(task) {
  const { _id, userId, subjectId, ...rest } = task;
  return {
    id: _id.toString(),
    subjectId: subjectId ? subjectId.toString() : null,
    ...rest,
  };
}
