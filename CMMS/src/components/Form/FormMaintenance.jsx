import React, { useState, forwardRef } from 'react';
import { Box, Typography, TextField, Button, Autocomplete, Snackbar, Alert } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { apiMantenimiento } from '../../utils/Fetch';
import { format } from 'date-fns';
import { jwtDecode } from 'jwt-decode';

const FormMaintenance = forwardRef(({ equipos, tecnicos, salas, handleClose }, ref) => {
    const [taskDescription, setTaskDescription] = useState('');
    const [selectedTechnician, setSelectedTechnician] = useState(null);
    const [selectedEquipo, setSelectedEquipo] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [startTime, setStartTime] = useState(null); // "Desde"
    const [endTime, setEndTime] = useState(null); // "Hasta"
    const handleDateChange = (newValue) => {
        const currentDate = new Date();
        const chosenDate = new Date(newValue);

        // Ajustamos ambas fechas para que la hora sea 00:00:00
        currentDate.setHours(0, 0, 0, 0);
        chosenDate.setHours(0, 0, 0, 0);

        // Validamos si la fecha es anterior o igual a la actual
        if (chosenDate < currentDate) {
            setSnackbarMessage("No se puede seleccionar una fecha anterior al día actual.");
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } else if (chosenDate.getTime() === currentDate.getTime()) {
            setSnackbarMessage("No se puede seleccionar la fecha actual.");
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        } else {
            setSelectedDate(newValue); // Si es válida, actualizamos la fecha seleccionada
        }
    };



    const handleSubmit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem('token');
        let userId = null;

        if (token) {
            const decodedToken = jwtDecode(token);
            userId = decodedToken.id; // Asumiendo que el id del usuario está en el payload del token
        }
        const nuevoMantenimiento = {
            fecha: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
            desde: startTime ? format(startTime, "HH:mm") : null, // Hora de inicio
            hasta: endTime ? format(endTime, "HH:mm") : null, // Hora de fin
            empresa: selectedTechnician?.empresa || null,
            descripcion: taskDescription || null,
            id_tecnico: selectedTechnician?.id_tecnico || null,
            id_equipo: selectedEquipo?.id || null,
            estado: 'PROGRAMADO',
            id_usuario: userId
        };
        try {
            const response = await fetch(apiMantenimiento, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoMantenimiento),
            });

            if (response.ok) {
                setSnackbarMessage('Mantenimiento guardado correctamente.');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
            } else if (response.status === 400) {
                setSnackbarMessage('No se puede asignar una fecha anterior a la actual.');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        } catch (error) {
            setSnackbarMessage('Error en la solicitud.');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
        }

        setTaskDescription('');
        setSelectedTechnician(null);
        setSelectedEquipo(null);
        setSelectedDate(null);
        setStartTime(null);
        setEndTime(null);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };


    return (<Box
        ref={ref}
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 600 }, // Ancho del modal: 90% en pantallas pequeñas
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 4,
          p: { xs: 2, sm: 4 }, // Padding dinámico para móviles
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography variant="h6" align="center">Cargar Nuevo Mantenimiento</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Descripción de la Tarea"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={4}
            required
          />
      
          {/* Autocomplete de técnico */}
          <Autocomplete
            options={tecnicos}
            value={selectedTechnician}
            onChange={(event, newValue) => setSelectedTechnician(newValue)}
            getOptionLabel={(option) => option?.nombre || ""}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Técnico" margin="normal" required />
            )}
          />
      
          {/* Autocomplete de equipo */}
          <Autocomplete
            options={equipos}
            value={selectedEquipo}
            onChange={(event, newValue) => setSelectedEquipo(newValue)}
            isOptionEqualToValue={(option, value) => option.id === value.id} // Comparar por ID único
            getOptionLabel={(option) => `${option.modelo} - ${option.modalidad} (${salas.find(sala => sala.ubicacion === option.sala)?.sala || 'Desconocida'})`}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar Equipo" margin="normal" required />
            )}
          />
      
          {/* Selector de fecha */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
            <DatePicker
                label="Fecha"
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
                inputFormat="dd/MM/yyyy" // Formato dd/MM/yyyy
                disableOpenPicker
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
              <TimePicker
                label="Hora de Inicio"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                ampm={false} // Formato de 24 horas
                disableOpenPicker
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
              <TimePicker
                label="Hora de Fin"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                ampm={false} // Formato de 24 horas
                disableOpenPicker
                renderInput={(params) => (
                  <TextField {...params} fullWidth required />
                )}
              />
            </Box>
          </LocalizationProvider>
      
          {/* Bloque Botones */}
          <Box mt={3} display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="flex-end" gap={2}>
            <Button variant="contained" color="primary" type="submit" fullWidth={true}>Guardar</Button>
            <Button variant="outlined" color="secondary" onClick={handleClose} fullWidth={true}>Cancelar</Button>
          </Box>
        </form>
      
        {/* Snackbar para mensajes */}
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
      )
})


export default FormMaintenance;