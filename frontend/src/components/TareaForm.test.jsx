import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TareaForm, { validarTarea } from './TareaForm';

const categorias = [
  { id: 1, nombre: 'Universidad' },
  { id: 2, nombre: 'SENA' },
];

describe('TareaForm', () => {
  test('validarTarea exige título', () => {
    expect(validarTarea({ titulo: '  ', descripcion: '' }).titulo).toBeDefined();
    expect(validarTarea({ titulo: 'Leer', descripcion: '' })).toEqual({});
  });

  test('no envía el formulario si falta el título', async () => {
    const onGuardar = vi.fn();
    render(<TareaForm categorias={categorias} onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    expect(screen.getByText('El título es obligatorio')).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  test('envía los datos limpios al guardar', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<TareaForm categorias={categorias} onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Título'), '  Evidencia AA5  ');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '2');
    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'alta');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    expect(onGuardar).toHaveBeenCalledWith({
      titulo: 'Evidencia AA5',
      descripcion: '',
      categoriaId: 2,
      prioridad: 'alta',
      fechaLimite: null,
    });
  });

  test('muestra los errores que devuelve la API', async () => {
    const error = Object.assign(new Error('Datos inválidos'), { errores: { titulo: 'Título repetido' } });
    const onGuardar = vi.fn().mockRejectedValue(error);
    render(<TareaForm categorias={categorias} onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Título'), 'Algo');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar tarea' }));
    expect(await screen.findByText('Título repetido')).toBeInTheDocument();
    expect(screen.getByText('Datos inválidos')).toBeInTheDocument();
  });
});
