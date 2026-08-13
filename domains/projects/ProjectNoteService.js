import { normalizeOptionalDate } from '../../core/record.js';

export function createProjectNoteService(app) {
  const guard = app.managers.get('MutationGuard');

  function create(projectId, input) {
    guard.assertManager('ProjectNoteService');
    const project = requireProject(app, projectId);
    const note = normalizeProjectNote(input);
    const notes = [...normalizeProjectNotes(project.notes), note];
    const result = app.repositories.projects.update(projectId, { notes, updatedAt: new Date().toISOString() });
    app.events.emit('project.note.created', { projectId, note });
    return result;
  }

  function update(projectId, noteId, input) {
    guard.assertManager('ProjectNoteService');
    const project = requireProject(app, projectId);
    const notes = normalizeProjectNotes(project.notes);
    const index = notes.findIndex(note => note.id === noteId);
    if (index < 0) throw new Error('Project note not found');
    notes[index] = normalizeProjectNote({ ...input, id: noteId });
    const result = app.repositories.projects.update(projectId, { notes, updatedAt: new Date().toISOString() });
    app.events.emit('project.note.updated', { projectId, note: notes[index] });
    return result;
  }

  function remove(projectId, noteId) {
    guard.assertManager('ProjectNoteService');
    const project = requireProject(app, projectId);
    const notes = normalizeProjectNotes(project.notes);
    if (!notes.some(note => note.id === noteId)) throw new Error('Project note not found');
    const result = app.repositories.projects.update(projectId, { notes: notes.filter(note => note.id !== noteId), updatedAt: new Date().toISOString() });
    app.events.emit('project.note.deleted', { projectId, noteId });
    return result;
  }

  return Object.freeze({ create, update, remove });
}

export function normalizeProjectNotes(notes) {
  if (notes == null) return [];
  if (!Array.isArray(notes)) throw new Error('Project notes must be a list');
  return notes.map(normalizeProjectNote);
}

function normalizeProjectNote(note) {
  const text = String(note?.text ?? '').trim();
  const date = normalizeOptionalDate(note?.date);
  if (!text || !date) throw new Error('Note date and text are required');
  return { id: String(note.id || crypto.randomUUID()), date, text };
}

function requireProject(app, projectId) {
  const project = app.repositories.projects.findById(projectId);
  if (!project) throw new Error('Project not found');
  return project;
}
