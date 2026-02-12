import { TextField, TextFieldProps } from '@mui/material';
import React from 'react';

/**
 * Reusable text field wrapper with consistent styling and error handling
 */
export const FormTextField: React.FC<TextFieldProps> = (props) => {
  return <TextField fullWidth margin="normal" {...props} />;
};
