import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, FormControl, InputLabel, IconButton, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { Delete, Edit, Add } from '@mui/icons-material';

const App = () => {
  const excludes = [ 'created_on', 'created_by','modified_on', 'modified_by', 'status', 'id'];
  const [tables] = useState([
    'user', 'product', 'order', 'role', 'faq', 'producttype', 'subtype', 'address', 'transaction', 'cart'
  ]);
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'add', 'edit', 'delete'
  const [selectedRow, setSelectedRow] = useState(null); // For edit/delete
  const [formData, setFormData] = useState({}); // For add/edit forms

  // Fetch data when the selected table changes
  useEffect(() => {
    if (selectedTable) {
      axios.get(`http://localhost:8080/api/${selectedTable}`)
        .then(response => setData(response.data))
        .catch(error => console.error(error));
    }
  }, [selectedTable]);

  // Handle dialog open
  const handleDialogOpen = (type, row = null) => {
    setDialogType(type);
    setSelectedRow(row);
    if (type === 'edit' && row) {
      setFormData(row); // Pre-fill form with row data for editing
    } else {
      setFormData({}); // Clear form for adding
    }
    setOpenDialog(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedRow(null);
    setFormData({});
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle add/edit form submission
  const handleFormSubmit = () => {
    if (dialogType === 'add') {
      axios.post(`http://localhost:8080/api/${selectedTable}`, formData)
        .then(() => {
          handleDialogClose();
          axios.get(`http://localhost:8080/api/${selectedTable}`)
            .then(response => setData(response.data));
        })
        .catch(error => console.error(error));
    } else if (dialogType === 'edit' && selectedRow) {
      axios.put(`http://localhost:8080/api/${selectedTable}/${selectedRow.id}`, formData)
        .then(() => {
          handleDialogClose();
          axios.get(`http://localhost:8080/api/${selectedTable}`)
            .then(response => setData(response.data));
        })
        .catch(error => console.error(error));
    }
  };

  // Handle delete action
  const handleDelete = () => {
    if (selectedRow) {
      axios.delete(`http://localhost:8080/api/${selectedTable}/${selectedRow.id}`)
        .then(() => {
          handleDialogClose();
          axios.get(`http://localhost:8080/api/${selectedTable}`)
            .then(response => setData(response.data));
        })
        .catch(error => console.error(error));
    }
  };

  // Format date to a human-readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(); // Adjust format as needed
  };

  // Filter out password field for the 'user' table
  const filterFields = (row) => {
    if (selectedTable === 'user') {
      const { password, ...rest } = row; // Exclude password field
      return rest;
    }
    return row;
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Admin Panel</h1>
      <FormControl style={{ minWidth: '200px', marginBottom: '20px' }}>
        <InputLabel>Select Table</InputLabel>
        <Select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value)}
        >
          {tables.map((table) => (
            <MenuItem key={table} value={table}>
              {table}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Add Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={() => handleDialogOpen('add')}
        style={{ marginBottom: '20px' }}
      >
        Add
      </Button>

      {/* Table */}
      {selectedTable && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Actions</TableCell>
                {data.length > 0 &&
                  Object.keys(filterFields(data[0])).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleDialogOpen('edit', row)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="secondary" onClick={() => handleDialogOpen('delete', row)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                  {Object.entries(filterFields(row)).map(([key, value]) => (
                    <TableCell key={key}>
                      {key.includes('_on') || key.includes('_date') ? formatDate(value) : JSON.stringify(value)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog for Add/Edit/Delete */}
      <Dialog open={openDialog} onClose={handleDialogClose}>
        <DialogTitle>
          {dialogType === 'add' && 'Add New Record'}
          {dialogType === 'edit' && 'Edit Record'}
          {dialogType === 'delete' && 'Delete Record'}
        </DialogTitle>
        <DialogContent>
          {dialogType === 'delete' ? (
            <p>Are you sure you want to delete this record?</p>
          ) : (
            data.length > 0 &&
            Object.keys(filterFields(data[0])).map((key) => !excludes.includes(key) && (
              <TextField
                key={key}
                name={key}
                label={key}
                value={formData[key] || ''}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
              />
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          {dialogType === 'delete' ? (
            <Button onClick={handleDelete} color="secondary">Delete</Button>
          ) : (
            <Button onClick={handleFormSubmit} color="primary">
              {dialogType === 'add' ? 'Add' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default App;