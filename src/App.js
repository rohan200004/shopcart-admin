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

const BASE_URL = "http://localhost:5000";

const App = () => {
  const excludes = ["auth", "app"];
  const systemFields = [
    "id",
    "created_on",
    "modified_on",
    "created_by",
    "modified_by",
  ]; // add more as needed
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

  // Attach JWT
  useEffect(() => {
    fetch(`${BASE_URL}/allroutes`)
      .then((res) => res.json())
      .then((data) =>
        setTables(
          data.data
            .map((d) => d.replace("/", ""))
            .filter((d) => !excludes.includes(d))
        )
      );
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
        }
        return Promise.reject(err);
      }
    );
    return () => {
      axios.interceptors.request.eject(reqInterceptor);
      axios.interceptors.response.eject(resInterceptor);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (selectedTable && isLoggedIn) fetchData(selectedTable);
  }, [selectedTable, isLoggedIn]);

  const fetchData = async (table) => {
    try {
      const res = await axios.get(`${BASE_URL}/${table}`);
      setData(res.data.data || []);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
    }
  };

  const fetchAllData = async () => {
    const results = {};
    let total = 0,
      success = 0;

    for (const table of tables) {
      try {
        const res = await axios.get(`${BASE_URL}/${table}`);
        results[table] = res.data.data || [];
        if (res.status === 200) success++;
      } catch {
        results[table] = [];
      } finally {
        total++;
      }
    }
    setAllData(results);
    setTotalCount(total);
    setSuccessCount(success);
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

  const handleFormSubmit = async () => {
    try {
      if (dialogType === "add") {
        await axios.post(`${BASE_URL}/${selectedTable}`, formData);
      } else if (dialogType === "edit" && selectedRow) {
        await axios.put(
          `${BASE_URL}/${selectedTable}/${selectedRow.id}`,
          formData
        );
      }
      handleDialogClose();
      fetchData(selectedTable);
    } catch (err) {
      console.error(`Error in ${dialogType}:`, err);
    }
  };

  const handleDelete = async () => {
    try {
      if (selectedRow) {
        await axios.delete(`${BASE_URL}/${selectedTable}/${selectedRow.id}`);
        handleDialogClose();
        fetchData(selectedTable);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const formatDate = (val) => new Date(val).toLocaleString();
  const filterFields = (row) => {
    const copy = { ...row };
    excludes.forEach((k) => delete copy[k]);
    return copy;
  };

  const handleLoginSuccess = () => setIsLoggedIn(true);
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <Login onLoginSuccess={handleLoginSuccess} />;

  return (
    <Container maxWidth="lg">
      {/* Top Bar */}
      <AppBar position="static" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Button color="inherit" startIcon={<Logout />} onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Controls */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Table</InputLabel>
          <Select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
          >
            {tables &&
              tables.map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleDialogOpen("add")}
        >
          Add
        </Button>
        <Button variant="outlined" onClick={fetchAllData}>
          Run All
        </Button>

        <Typography variant="body1" ml={2}>
          Total: {totalCount} | Success: {successCount}
        </Typography>
      </Box>

      {/* Selected Table Data */}
      {selectedTable && (
        <TableContainer component={Paper} sx={{ mb: 4, maxHeight: 500 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Actions</TableCell>
                {data.length > 0 &&
                  Object.keys(filterFields(data[0])).map((k) => (
                    <TableCell key={k}>{k}</TableCell>
                  ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} hover>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleDialogOpen("edit", row)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDialogOpen("delete", row)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                  {Object.entries(filterFields(row)).map(([k, v]) => (
                    <TableCell key={k}>
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
                >
                  <Typography variant="h6">{t}</Typography>
                </Button>
                <Collapse in={expandedTables[t]}>
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Actions</TableCell>
                          {allData[t].length > 0 &&
                            Object.keys(filterFields(allData[t][0])).map(
                              (k) => <TableCell key={k}>{k}</TableCell>
                            )}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allData[t].map((row, i) => (
                          <TableRow key={i} hover>
                            <TableCell>
                              <IconButton
                                color="primary"
                                onClick={() => handleDialogOpen("edit", row)}
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                color="error"
                                onClick={() => handleDialogOpen("delete", row)}
                              >
                                <Delete />
                              </IconButton>
                            </TableCell>
                            {Object.entries(filterFields(row)).map(([k, v]) => (
                              <TableCell key={k}>
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
        onClose={handleDialogClose}
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
                  ? Object.keys(filterFields(selectedRow)) // use row fields for edit
                  : data.length > 0
                  ? Object.keys(filterFields(data[0])) // fallback: first row fields for add
                  : []
                ) // nothing if no data yet
                  .filter((k) => !systemFields.includes(k)) // hide unwanted fields
                  .map((k) => (
                    <TextField
                      key={k}
                      name={k}
                      label={k.charAt(0).toUpperCase() + k.slice(1)}
                      value={formData[k] ?? ""}
                      onChange={handleInputChange}
                      fullWidth
                      margin="normal"
                    />
                  ))}
              </>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Cancel</Button>
          {dialogType === "delete" ? (
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          ) : (
            <Button
              onClick={handleFormSubmit}
              color="primary"
              variant="contained"
            >
              {dialogType === "add" ? "Add" : "Save"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
