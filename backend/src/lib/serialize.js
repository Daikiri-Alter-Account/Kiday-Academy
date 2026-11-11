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

function displayName(user) {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    "Estudiante"
  );
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function serializeMaterial(material) {
  const { _id, userId, subjectId, ...rest } = material;
  return {
    id: _id.toString(),
    subjectId: subjectId ? subjectId.toString() : null,
    ...rest,
  };
}

export function serializeGradeItem(item) {
  const { _id, userId, subjectId, ...rest } = item;
  return {
    id: _id.toString(),
    subjectId: subjectId ? subjectId.toString() : null,
    ...rest,
  };
}

export function serializeGroupMember(member, user) {
  const name = displayName(user);
  return {
    id: user._id.toString(),
    name,
    firstName: user.firstName?.trim() || name.split(/\s+/)[0] || "Estudiante",
    initials: initials(name),
    role: member.role,
    joinedAt: member.joinedAt,
  };
}

export function serializeGroupMessage(message, user) {
  const name = displayName(user);
  return {
    id: message._id.toString(),
    content: message.content,
    createdAt: message.createdAt,
    author: {
      id: user._id.toString(),
      name,
      firstName: user.firstName?.trim() || name.split(/\s+/)[0] || "Estudiante",
      initials: initials(name),
    },
  };
}

export function serializeGroupSession(session) {
  const { _id, groupId, createdBy, ...rest } = session;
  return {
    id: _id.toString(),
    createdBy: createdBy ? createdBy.toString() : null,
    ...rest,
  };
}

export function serializeGroup(group, { role, memberCount = 0, members = [], sessions = [], nextSession } = {}) {
  const { _id, ownerId, ...rest } = group;
  return {
    id: _id.toString(),
    ownerId: ownerId.toString(),
    role,
    memberCount,
    members,
    sessions,
    nextSession: nextSession !== undefined ? nextSession : sessions[0] ?? null,
    ...rest,
  };
}
