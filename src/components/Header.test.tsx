import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';

test('Render header element', () => {
  const props = { title: 'Glou Glou Cashup' };
  render(<Header title={props.title} />);

  expect(screen.getByText('Glou Glou Cashup')).toBeTruthy;
});
