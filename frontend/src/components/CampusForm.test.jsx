import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CampusForm, { validarCampus } from './CampusForm';

const categorias = [{ id: 1, nombre: 'Universidad' }];

describe('CampusForm', () => {
  test('validarCampus exige nombre y un enlace https al conectar', () => {
    expect(validarCampus({ nombre: '', enlace: '' }, true)).toEqual({
      nombre: expect.any(String),
      enlace: expect.any(String),
    });
    expect(validarCampus({ nombre: 'Zajuna', enlace: 'mi-clave' }, true).enlace).toBeDefined();
    expect(validarCampus({ nombre: 'Zajuna', enlace: 'webcal://campus.co/f.ics' }, true)).toEqual({});
    expect(validarCampus({ nombre: 'Zajuna', enlace: '' }, false)).toEqual({});
  });

  test('envía el campus con su enlace y categoría', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<CampusForm categorias={categorias} onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Nombre'), 'Unimagdalena');
    await userEvent.type(screen.getByLabelText('Enlace del calendario'), 'https://campus.co/export?token=1');
    await userEvent.selectOptions(screen.getByLabelText('Categoría para sus tareas'), '1');
    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));
    expect(onGuardar).toHaveBeenCalledWith({
      nombre: 'Unimagdalena',
      categoriaId: 1,
      enlace: 'https://campus.co/export?token=1',
    });
  });

  test('el enlace se escribe oculto, como una contraseña', () => {
    render(<CampusForm categorias={categorias} onGuardar={() => {}} onCancelar={() => {}} />);
    expect(screen.getByLabelText('Enlace del calendario')).toHaveAttribute('type', 'password');
  });

  test('al editar no envía el enlace si se deja vacío', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(
      <CampusForm
        campus={{ id: 4, nombre: 'Zajuna', categoria_id: null }}
        categorias={categorias}
        onGuardar={onGuardar}
        onCancelar={() => {}}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(onGuardar).toHaveBeenCalledWith({ nombre: 'Zajuna', categoriaId: null });
  });

  test('muestra el error del servidor junto al enlace', async () => {
    const error = Object.assign(new Error('No se pudo leer el calendario'), {
      errores: { enlace: 'El enlace no devolvió un calendario' },
    });
    render(<CampusForm categorias={categorias} onGuardar={vi.fn().mockRejectedValue(error)} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Nombre'), 'Zajuna');
    await userEvent.type(screen.getByLabelText('Enlace del calendario'), 'https://zajuna.co/x');
    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));
    expect(await screen.findByText('El enlace no devolvió un calendario')).toBeInTheDocument();
  });
});
