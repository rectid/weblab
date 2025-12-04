import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Box, Typography, TextField, Button, List, ListItem, ListItemText, Alert } from '@mui/material'
// dynamically import socket.io-client at runtime to avoid ESM interop issues

type Price = { symbol: string; price: number }

export default function TradingPage(){
  const [startDate, setStartDate] = useState<string>('')
  const [speed, setSpeed] = useState<number>(1)
  const [isRunning, setIsRunning] = useState(false)
  const [currentDate, setCurrentDate] = useState<string>('')
  const [prices, setPrices] = useState<Price[]>([])
  const [participants, setParticipants] = useState<string[]>([])
  const participantsRef = useRef<string[]>([])

  // keep ref in sync so websocket handlers always see latest participants
  useEffect(()=>{ participantsRef.current = participants }, [participants])

  useEffect(()=>{
    // dynamically import to avoid possible ESM interop mismatches that cause
    // "(intermediate value)(...) is not a function" errors in some bundlers
    let socket: any = null
    let mounted = true
    ;(async ()=>{
      try{
        const mod = await import('socket.io-client')
        const ioFn = mod.io || mod.default || mod
        socket = ioFn('http://localhost:3001')

        // fetch participants once on mount so UI shows active stocks even before websocket state
        try{
          const res = await axios.get('http://localhost:3001/trading/participants')
          if (!mounted) return
          setParticipants(res.data.participants || [])
        }catch(e){ /* ignore */ }

        socket.on('connect', ()=> console.log('ws connected'))
        socket.on('priceUpdate', async (data:any) => {
          setCurrentDate(data.date)
          const parts = participantsRef.current
          if (parts && parts.length) {
            setPrices((data.prices || []).filter((p: any) => parts.includes(p.symbol)))
          } else {
            // no participants known yet — fallback to only currently active stocks
            try{
              const res = await axios.get('http://localhost:3001/stocks')
              const active = (res.data || []).filter((s: any) => s.isActive).map((s: any) => s.symbol)
              setPrices((data.prices || []).filter((p: any) => active.includes(p.symbol)))
            }catch(e){
              setPrices(data.prices || [])
            }
          }
        })
        socket.on('tradingState', (data:any) => { setIsRunning(data.settings?.isActive); setParticipants(data.participants || []) })
      }catch(err){
        console.error('failed to load socket.io-client', err)
      }
    })()
    return ()=>{ mounted = false; if (socket) socket.disconnect() }
  },[])

  async function saveSettings(){
    const safeSpeed = Math.max(0, Number(speed))
    await axios.post('http://localhost:3001/trading/settings', { startDate, speed: safeSpeed })
  }

  async function start(){
    await saveSettings()
    // fetch current selection from Stocks page (server-side isActive flags)
    try{
      const sres = await axios.get('http://localhost:3001/stocks')
      const selected = (sres.data || []).filter((s: any) => s.isActive).map((s: any) => s.symbol)
      await axios.post('http://localhost:3001/trading/start', { participants: selected })
      try{ const res = await axios.get('http://localhost:3001/trading/participants'); setParticipants(res.data.participants || []) }catch(e){}
    }catch(err){
      // fallback: start without explicit participants
      await axios.post('http://localhost:3001/trading/start')
      try{ const res = await axios.get('http://localhost:3001/trading/participants'); setParticipants(res.data.participants || []) }catch(e){}
    }
  }

  async function stop(){
    await axios.post('http://localhost:3001/trading/stop')
  }

  async function pause(){
    await axios.post('http://localhost:3001/trading/pause')
  }

  async function resume(){
    await axios.post('http://localhost:3001/trading/resume')
  }

  async function resetSim(){
    await axios.post('http://localhost:3001/trading/reset')
    // clear local UI state
    setCurrentDate('')
    setPrices([])
    try{ const res = await axios.get('http://localhost:3001/trading/participants'); setParticipants(res.data.participants || []) }catch(e){}
  }

  return (
    <Box>
      <Typography variant="h5">Trading Simulation</Typography>
      <Box sx={{ my:2, display:'flex', gap:2, alignItems:'center' }}>
        <TextField
          label="Start date"
          type="date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={e=>setStartDate(e.target.value)}
        />
        <TextField label="Speed (s)" type="number" inputProps={{ min: 0 }} value={speed} onChange={e=>setSpeed(Number(e.target.value))} />
        <Button variant="contained" onClick={start} disabled={isRunning}>Start Trading</Button>
        <Button variant="outlined" onClick={pause} disabled={!isRunning}>Pause</Button>
        <Button variant="outlined" onClick={resume} disabled={isRunning}>Resume</Button>
        <Button color="error" variant="contained" onClick={resetSim}>Reset</Button>
      </Box>

      <Typography>Simulation running: {isRunning ? 'Yes' : 'No'}</Typography>
      <Typography>Current simulated date: {currentDate}</Typography>

      {isRunning && (
        <Alert severity="info" sx={{ my:2 }}>
          Participants are locked for this run. Use <strong>Reset</strong> then <strong>Start</strong> to apply checkbox changes.
        </Alert>
      )}

      {/* Participants display removed per user request */}
      <List>
        {prices.map(p=> (
          <ListItem key={p.symbol}><ListItemText primary={`${p.symbol}: $${p.price}`} /></ListItem>
        ))}
      </List>
    </Box>
  )
}
