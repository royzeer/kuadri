import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MetaForm, { separarPasos, validarMeta } from './MetaForm';

describe('MetaForm', () => {
  test('separarPasos toma un paso por renglón e ignora los vacíos', () => {
    expect(separarPasos(' Curso A2 \n\n Curso B1\n')).toEqual(['Curso A2', 'Curso B1']);
    expect(validarMeta({ titulo: ' ', descripcion: '', pasos: '' }).titulo).toBeDefined();
  });

  test('envía la meta con sus pasos al crearla', async () => {
    const onGuardar = vi.fn().mockResolvedValue();
    render(<MetaForm categorias={[{ id: 3, nombre: 'Personal' }]} onGuardar={onGuardar} onCancelar={() => {}} />);
    await userEvent.type(screen.getByLabelText('Meta'), 'Aprender inglés');
    await userEvent.selectOptions(screen.getByLabelText('Categoría'), '3');
    await userEvent.type(screen.getByLabelText('Pasos (uno por renglón, opcional)'), 'Curso A2{enter}Curso B1');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar meta' }));
    expect(onGuardar).toHaveBeenCalledWith({
      titulo: 'Aprender inglés',
      descripcion: '',
      categoriaId: 3,
      fechaObjetivo: null,
      pasos: ['Curso A2', 'Curso B1'],
    });
  });

  test('al editar no muestra el campo de pasos', () => {
    render(<MetaForm meta={{ id: 1, titulo: 'Ahorrar' }} categorias={[]} onGuardar={() => {}} onCancelar={() => {}} />);
    expect(screen.queryByLabelText('Pasos (uno por renglón, opcional)')).not.toBeInTheDocument();
  });
});
