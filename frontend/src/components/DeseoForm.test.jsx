import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import DeseoForm, { validarDeseo } from './DeseoForm';

const vacio = { nombre: '', enlace: '', imagen: '', precioObjetivo: '', precioActual: '' };

describe('DeseoForm', () => {
  test('validarDeseo exige nombre y enlaces web', () => {
    expect(validarDeseo(vacio).nombre).toBeDefined();
    const errores = validarDeseo({ ...vacio, nombre: 'Tenis', enlace: 'tienda.com', precioObjetivo: '-1' });
    expect(Object.keys(errores).sort()).toEqual(['enlace', 'precioObjetivo']);
  });

  test('envía el deseo con el precio de hoy como número', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<DeseoForm onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Qué quieres'), 'Tenis');
    await userEvent.type(screen.getByLabelText('Precio que quieres pagar'), '200000');
    await userEvent.type(screen.getByLabelText('Precio de hoy (opcional)'), '250000');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar deseo' }));
    expect(onGuardar).toHaveBeenCalledWith({
      nombre: 'Tenis',
      enlace: null,
      imagen: null,
      precioObjetivo: 200000,
      prioridad: 'media',
      precioActual: 250000,
      tienda: null,
    });
  });

  test('no envía si el enlace no es válido', async () => {
    const onGuardar = vi.fn();
    render(<DeseoForm onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Qué quieres'), 'Tenis');
    await userEvent.type(screen.getByLabelText('Enlace de la tienda (opcional)'), 'tienda.com');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar deseo' }));
    expect(screen.getByText('Pega un enlace que empiece por https://')).toBeInTheDocument();
    expect(onGuardar).not.toHaveBeenCalled();
  });
});
