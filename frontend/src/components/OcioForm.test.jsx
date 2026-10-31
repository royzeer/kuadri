import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import OcioForm, { validarOcio } from './OcioForm';

describe('OcioForm', () => {
  test('validarOcio pide el título', () => {
    expect(validarOcio({ titulo: '  ', plataforma: '', comentario: '' }).titulo).toBeDefined();
  });

  test('envía el juego con su nota en estrellas', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<OcioForm onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Título'), 'Celeste');
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'en_curso');
    await userEvent.type(screen.getByLabelText('Dónde (opcional)'), 'Switch');
    await userEvent.click(screen.getByRole('button', { name: '4 de 5' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onGuardar).toHaveBeenCalledWith({
      titulo: 'Celeste',
      tipo: 'videojuego',
      estado: 'en_curso',
      calificacion: 4,
      plataforma: 'Switch',
      comentario: null,
    });
  });

  test('tocar otra vez la misma estrella quita la nota', async () => {
    render(<OcioForm ocio={{ id: 1, titulo: 'Dune', tipo: 'libro', calificacion: 3 }} onGuardar={() => {}} onCancelar={() => {}} />);
    const tres = screen.getByRole('button', { name: '3 de 5' });
    expect(tres).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(tres);
    expect(tres).toHaveAttribute('aria-pressed', 'false');
  });
});
