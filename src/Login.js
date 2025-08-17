import React, { useState } from 'react';
import axios from 'axios';
import { TextField, Button, Paper, Typography } from '@mui/material';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const BASE_URL = 'http://localhost:5000';
  const handleLogin = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email:username,
        password,
      });
      localStorage.setItem('token', response.data.data.token); // Store token
      onLoginSuccess(); // Notify parent component of successful login
    } catch (error) {
      setError('Invalid username or password');
    }
  };

  return (
    <Paper style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Login
      </Typography>
      <TextField
        label="Username"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleLogin}
        style={{ marginTop: '20px' }}
      >
        Login
      </Button>
    </Paper>
  );
};

export default Login;