import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Collapse,
  Box,
  Typography,
  Toolbar,
  Container,
  AppBar,
  CircularProgress,
  Backdrop,
  Alert,
  Snackbar
} from "@mui/material";
import {
  Delete,
  Edit,
  Add,
  ExpandMore,
  ExpandLess,
  Logout,
} from "@mui/icons-material";
import Login from "./Login";

const excludes = ["auth", "app"];
const systemFields = [
  "id",
  "created_on",
  "modified_on",
  "created_by",
  "modified_by",
]; // add more as needed

const App = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [data, setData] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allData, setAllData] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  // Get server URL from localStorage or use default
  const getBaseUrl = () => {
    return localStorage.getItem('serverUrl') || 'http://localhost:5000';
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Attach JWT
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setIsLoading(true);
      const reqInterceptor = axios.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      });
      
      const resInterceptor = axios.interceptors.response.use(
        (res) => res,
        (err) => {
          if (err.response?.status === 401) {
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            showSnackbar('Session expired. Please log in again.', 'error');
          } else if (err.response?.data?.message) {
            showSnackbar(err.response.data.message, 'error');
          } else {
            showSnackbar('An error occurred', 'error');
          }
          return Promise.reject(err);
        }
      );
    
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
      const res = await axios.get(`${getBaseUrl()}/allroutes`);
      setTables(
        res.data.data
          .map((d) => d.replace("/", ""))
          .filter((d) => !excludes.includes(d))
      );
    } catch (err) {
      console.error('Error fetching routes:', err);
      showSnackbar('Failed to load routes', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (selectedTable && isLoggedIn) fetchData(selectedTable);
  }, [selectedTable, isLoggedIn]);

  const fetchData = async (table) => {
    if (!table) return;
    
    setIsLoading(true);
    try {
      const res = await axios.get(`${getBaseUrl()}/${table}`);
      setData(res.data.data || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      showSnackbar(`Failed to load ${table} data`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    const results = {};
    let total = 0,
      success = 0;
    
    setIsFetchingAll(true);
    setAllData({});
    
    try {
      for (const table of tables) {
        try {
          const res = await axios.get(`${getBaseUrl()}/${table}`);
          results[table] = res.data.data || [];
          if (res.status === 200) success++;
        } catch (error) {
          results[table] = [];
          console.error(`Error fetching ${table}:`, error);
        } finally {
          total++;
        }
      }
      setAllData(results);
      setTotalCount(total);
      setSuccessCount(success);
      showSnackbar(`Successfully loaded ${success} of ${total} tables`, 'success');
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setIsFetchingAll(false);
    }
  };

  const handleDialogOpen = (type, row = null) => {
    setDialogType(type);
    setSelectedRow(row);
    setFormData(type === "edit" ? { ...row } : {});
    setOpenDialog(true);
  };
  const handleDialogClose = () => {
    setOpenDialog(false);
    setSelectedRow(null);
    setFormData({});
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
  }
  const handleFormSubmit = async () => {
    if (!selectedTable) return;
    
    setIsLoading(true);
    try {
      Object.entries(formData).map(([key, value]) => {
        if (typeof value === 'object' && value !== null && isPlainObject(value)) {
          delete formData[key];
          formData[key+'_id'] = value.id;
        } else if(typeof value === 'string' && value.includes(',')){
          formData[key] = value.replace(/'/g, '"').split(',');
        }
      });
      if (dialogType === "add") {
        await axios.post(`${getBaseUrl()}/${selectedTable}`, formData);
        showSnackbar('Record added successfully', 'success');
      } else if (dialogType === "edit" && selectedRow) {
        await axios.put(
          `${getBaseUrl()}/${selectedTable}/${selectedRow.id}`,
          formData
        );
        showSnackbar('Record updated successfully', 'success');
      }
      handleDialogClose();
      fetchData(selectedTable);
    } catch (err) {
      console.error(`Error in ${dialogType}:`, err);
      showSnackbar(`Failed to ${dialogType} record`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow || !selectedTable) return;
    
    setIsLoading(true);
    try {
      await axios.delete(`${getBaseUrl()}/${selectedTable}/${selectedRow.id}`);
      showSnackbar('Record deleted successfully', 'success');
      handleDialogClose();
      fetchData(selectedTable);
    } catch (err) {
      console.error("Delete error:", err);
      showSnackbar('Failed to delete record', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (val) => new Date(val).toLocaleString();
  const filterFields = (row) => {
    const copy = { ...row };
    excludes.forEach((k) => delete copy[k]);
    return copy;
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchTables();
  };
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <Container maxWidth="lg">
      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading || isFetchingAll}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Top Bar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'white' }}>
            Admin Panel
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<Logout />} 
            onClick={handleLogout}
            sx={{ color: 'white' }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Controls */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel sx={{ color: 'text.primary' }}>Select Table</InputLabel>
          <Select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            disabled={isLoading || isFetchingAll}
            sx={{
              '& .MuiSelect-select': {
                color: 'text.primary',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
              },
            }}
          >
            {tables &&
              tables.map((t) => (
                <MenuItem key={t} value={t} sx={{ color: 'text.primary' }}>
                  {t}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleDialogOpen("add")}
          disabled={!selectedTable || isLoading || isFetchingAll}
        >
          Add
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={fetchAllData}
          disabled={isLoading || isFetchingAll}
          startIcon={isFetchingAll ? <CircularProgress size={20} color="inherit" /> : null}
          sx={{
            color: 'text.primary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
            },
          }}
        >
          {isFetchingAll ? 'Loading...' : 'Run All'}
        </Button>

        <Typography variant="body1" ml={2} sx={{ color: 'text.primary' }}>
          Total: {totalCount} | Success: {successCount}
        </Typography>
      </Box>

      {/* Selected Table Data */}
      {selectedTable && (
        <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', bgcolor: 'background.paper' }}>Actions</TableCell>
                {data.length > 0 &&
                  Object.keys(filterFields(data[0])).map((k) => (
                    <TableCell 
                      key={k} 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: 'text.primary', 
                        bgcolor: 'background.paper',
                        '&:hover': {
                          bgcolor: 'action.hover'
                        }
                      }}
                    >
                      {k}
                    </TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow 
                  key={i} 
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: 'action.hover',
                    },
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                  }}
                >
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleDialogOpen("edit", row)}
                      disabled={isLoading}
                      size="small"
                      sx={{ color: 'primary.main' }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDialogOpen("delete", row)}
                      disabled={isLoading}
                      size="small"
                      sx={{ color: 'error.main' }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                  {Object.entries(filterFields(row)).map(([k, v]) => (
                    <TableCell 
                      key={k}
                      sx={{ 
                        color: 'text.primary',
                        borderColor: 'divider'
                      }}
                    >
                      {k.includes("_on") || k.includes("_date")
                        ? formatDate(v)
                        : JSON.stringify(v)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* All Tables Expanded */}
      {Object.keys(allData).length > 0 && (
        <Box>
          {tables &&
            tables.map((t) => (
              <Box key={t} mb={3}>
                <Button
                  variant="text"
                  onClick={() =>
                    setExpandedTables((prev) => ({ ...prev, [t]: !prev[t] }))
                  }
                  startIcon={
                    expandedTables[t] ? <ExpandLess /> : <ExpandMore />
                  }
                  sx={{ color: 'primary.main' }}
                >
                  <Typography variant="h6" sx={{ color: 'text.primary' }}>{t}</Typography>
                </Button>
                <Collapse in={expandedTables[t]}>
                  <TableContainer component={Paper} sx={{ maxHeight: 400, mt: 1 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', bgcolor: 'background.paper' }}>Actions</TableCell>
                          {allData[t].length > 0 &&
                            Object.keys(filterFields(allData[t][0])).map(
                              (k) => (
                                <TableCell 
                                  key={k} 
                                  sx={{ 
                                    fontWeight: 'bold', 
                                    color: 'text.primary', 
                                    bgcolor: 'background.paper',
                                    '&:hover': {
                                      bgcolor: 'action.hover'
                                    }
                                  }}
                                >
                                  {k}
                                </TableCell>
                              )
                            )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allData[t].map((row, i) => (
                          <TableRow 
                            key={i} 
                            hover
                            sx={{
                              '&:nth-of-type(odd)': {
                                backgroundColor: 'action.hover',
                              },
                              '&:hover': {
                                backgroundColor: 'action.selected',
                              },
                            }}
                          >
                            <TableCell>
                              <IconButton
                                color="primary"
                                onClick={() => handleDialogOpen("edit", { ...row, __tableName: t })}
                                disabled={isLoading}
                                size="small"
                                sx={{ color: 'primary.main' }}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleDialogOpen("delete", { ...row, __tableName: t })}
                                disabled={isLoading}
                                size="small"
                                sx={{ color: 'error.main' }}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                            {Object.entries(filterFields(row)).map(([k, v]) => (
                              <TableCell 
                                key={k}
                                sx={{ 
                                  color: 'text.primary',
                                  borderColor: 'divider'
                                }}
                              >
                                {k.includes("_on") || k.includes("_date")
                                  ? formatDate(v)
                                  : JSON.stringify(v)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </Box>
            ))}
        </Box>
      )}

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={isLoading ? null : handleDialogClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType === "add" && "Add New Record"}
          {dialogType === "edit" && "Edit Record"}
          {dialogType === "delete" && "Confirm Delete"}
        </DialogTitle>
        <DialogContent>
          {dialogType === "delete" ? (
            <Typography>
              Are you sure you want to delete this record?
            </Typography>
          ) : (
            dialogType !== "delete" && (
              <>
                {(dialogType === "edit" && selectedRow
                  ? Object.keys(filterFields(selectedRow))
                  : data.length > 0
                  ? Object.keys(filterFields(data[0]))
                  : []
                )
                  .filter((k) => !systemFields.includes(k))
                  .map((k) => (
                    <TextField
                      key={k}
                      name={k}
                      label={k.charAt(0).toUpperCase() + k.slice(1)}
                      value={formData[k] ?? ""}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                      disabled={isLoading}
                    />
                  ))}
              </>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDialogClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          {dialogType === "delete" ? (
            <Button 
              onClick={handleDelete} 
              color="error" 
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          ) : (
            <Button
              onClick={handleFormSubmit}
              color="primary"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isLoading 
                ? dialogType === "add" ? 'Adding...' : 'Saving...'
                : dialogType === "add" ? 'Add' : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
