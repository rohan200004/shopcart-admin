import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Button, Paper, Typography, CircularProgress, Link } from '@mui/material';

const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Load saved server URL on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem('serverUrl') || 'http://localhost:5000';
    setServerUrl(savedUrl);
  }, []);
  
  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    
    if (!serverUrl) {
      setError('Please enter server URL');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Save the server URL to localStorage
      localStorage.setItem('serverUrl', serverUrl);
      
      const response = await axios.post(`${serverUrl}/auth/login`, {
        email: username,
        password,
      });
      localStorage.setItem('token', response.data.data.token);
      onLoginSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed. Please check your credentials and server URL.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Paper style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Admin Panel Login
      </Typography>
      <TextField
        label="Server URL"
        fullWidth
        margin="normal"
        value={serverUrl}
        onChange={(e) => setServerUrl(e.target.value)}
        disabled={isLoading}
        placeholder="http://localhost:5000"
      />
      <TextField
        label="Username"
        fullWidth
        margin="normal"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={isLoading}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isLoading}
        onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
      />
      {error && <Typography color="error" sx={{ mt: 1, mb: 1 }}>{error}</Typography>}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleLogin}
        disabled={isLoading}
        style={{ marginTop: '10px' }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
      </Button>
      <Typography variant="caption" display="block" align="center" sx={{ mt: 2 }}>
        Enter your server URL (e.g., http://localhost:5000)
      </Typography>
    </Paper>
  );
};

export default Login;