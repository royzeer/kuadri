import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PaletaForm, { validarPaleta } from './PaletaForm';

describe('PaletaForm', () => {
  test('validarPaleta pide nombre y colores con formato #RRGGBB', () => {
    expect(validarPaleta({ nombre: ' ', colores: ['#FFFFFF', '#000'] })).toEqual({
      nombre: 'Ponle un nombre a tu paleta',
      colores: 'Cada color debe tener el formato #RRGGBB',
    });
  });

  test('envía el nombre y los colores en mayúscula, sin el que se quitó', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<PaletaForm onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Nombre'), 'Atardecer');
    const codigo = screen.getByLabelText('Código del color 1');
    await userEvent.clear(codigo);
    await userEvent.type(codigo, '#ff7438');
    await userEvent.click(screen.getByRole('button', { name: 'Quitar el color 3' }));
    await userEvent.click(screen.getByRole('button', { name: 'Guardar paleta' }));
    expect(onGuardar).toHaveBeenCalledWith({ nombre: 'Atardecer', colores: ['#FF7438', '#141414'] });
  });

  test('no deja quitar colores si solo quedan dos', async () => {
    render(<PaletaForm paleta={{ id: 1, nombre: 'Dúo', colores: ['#FFFFFF', '#000000'] }} onGuardar={() => {}} onCancelar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Quitar el color 1' })).toBeDisabled();
  });
});
