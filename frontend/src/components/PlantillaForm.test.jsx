import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PlantillaForm from './PlantillaForm';

const paletas = [{ id: 7, nombre: 'Lima', colores: ['#141414', '#B1CB5A'] }];
const tipografias = [
  { id: 1, nombre: 'Space Grotesk' },
  { id: 2, nombre: 'Inter' },
];

describe('PlantillaForm', () => {
  test('la muestra usa la paleta y las fuentes elegidas', async () => {
    render(<PlantillaForm paletas={paletas} tipografias={tipografias} onGuardar={() => {}} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Nombre'), 'Portafolio');
    await userEvent.selectOptions(screen.getByLabelText('Paleta'), '7');
    await userEvent.selectOptions(screen.getByLabelText('Fuente de títulos'), '1');
    const titulo = screen.getByText('Portafolio', { selector: 'strong' });
    expect(titulo).toHaveStyle({ fontFamily: "'Space Grotesk', system-ui, sans-serif" });
    // Fondo oscuro: el texto pasa a blanco para que se lea
    expect(titulo.parentElement).toHaveStyle({ color: '#FFFFFF' });
  });

  test('envía los identificadores como números o null', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<PlantillaForm paletas={paletas} tipografias={tipografias} onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Nombre'), 'Web');
    await userEvent.selectOptions(screen.getByLabelText('Fuente de texto'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    expect(onGuardar).toHaveBeenCalledWith({ nombre: 'Web', paletaId: null, fuenteTitulosId: null, fuenteTextoId: 2, nota: null });
  });
});
