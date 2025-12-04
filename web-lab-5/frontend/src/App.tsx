import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Container, Button, useMediaQuery, useTheme, IconButton, Menu, MenuItem, ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import StocksPage from './pages/StocksPage'
import BrokersPage from './pages/BrokersPage'
import TradingPage from './pages/TradingPage'

const darkCyberTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00fff7',
    },
    secondary: {
      main: '#ff00ff',
    },
    background: {
      default: '#0a0a0f',
      paper: '#1a1a25',
    },
    error: {
      main: '#ff0055',
    },
    success: {
      main: '#00ff88',
    },
  },
  typography: {
    fontFamily: '"Rajdhani", "Roboto", sans-serif',
    h5: {
      fontFamily: '"Orbitron", sans-serif',
      letterSpacing: '2px',
    },
    h6: {
      fontFamily: '"Orbitron", sans-serif',
      letterSpacing: '2px',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#0a0a0f',
        },
      },
    },
  },
});

export default function App(){
  const theme = useTheme()
  const isMobile = useMediaQuery(darkCyberTheme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  return (
    <ThemeProvider theme={darkCyberTheme}>
      <CssBaseline />
      <div>
        <AppBar position="static">
          <Toolbar>
            <ShowChartIcon sx={{ mr: 2, color: '#00fff7', filter: 'drop-shadow(0 0 5px #00fff7)' }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: isMobile ? '0.9rem' : '1.25rem' }}>
              Cyber Exchange
            </Typography>
            {isMobile ? (
              <>
                <IconButton color="inherit" onClick={handleMenuOpen} sx={{ color: '#ff00ff' }}>
                  <MenuIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem component={Link} to="/stocks" onClick={handleMenuClose}>▸ Stocks</MenuItem>
                  <MenuItem component={Link} to="/brokers" onClick={handleMenuClose}>▸ Brokers</MenuItem>
                  <MenuItem component={Link} to="/trading" onClick={handleMenuClose}>▸ Trading</MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button color="inherit" component={Link} to="/stocks">◈ Stocks</Button>
                <Button color="inherit" component={Link} to="/brokers">◈ Brokers</Button>
                <Button color="inherit" component={Link} to="/trading">◈ Trading</Button>
              </>
            )}
          </Toolbar>
        </AppBar>
        <Container className="app-container" maxWidth={false} sx={{ px: isMobile ? 1 : 3 }}>
          <Routes>
            <Route path="/" element={<StocksPage/>} />
            <Route path="/stocks" element={<StocksPage/>} />
            <Route path="/brokers" element={<BrokersPage/>} />
            <Route path="/trading" element={<TradingPage/>} />
          </Routes>
        </Container>
      </div>
    </ThemeProvider>
  )
}
