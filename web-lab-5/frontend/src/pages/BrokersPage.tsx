import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, Typography, List, ListItem, ListItemText, IconButton, TextField, Button } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

type Broker = { id: string; name: string; initialBalance: number; currentBalance: number }

export default function BrokersPage(){
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [name, setName] = useState('')
  const [initial, setInitial] = useState<number>(100000)

  useEffect(()=>{ fetchBrokers() }, [])

  async function fetchBrokers(){
    try{ const res = await axios.get('http://localhost:3001/brokers'); setBrokers(res.data) }catch(e){ console.error(e) }
  }

  async function addBroker(){
    try{
      const safeInitial = Math.max(0, initial || 0)
      const res = await axios.post('http://localhost:3001/brokers', { name, initialBalance: safeInitial })
      setBrokers(prev => [...prev, res.data])
      setName('')
    }catch(e){ console.error(e) }
  }

  async function removeBroker(id: string){
    try{ await axios.delete(`http://localhost:3001/brokers/${id}`); setBrokers(prev => prev.filter(b=>b.id!==id)) }catch(e){ console.error(e) }
  }

  async function changeInitial(id: string, value: number){
    try{ 
      const safe = Math.max(0, value || 0)
      const res = await axios.put(`http://localhost:3001/brokers/${id}`, { initialBalance: safe });
      setBrokers(prev => prev.map(b=>b.id===id? res.data : b))
    }catch(e){ console.error(e) }
  }

  return (
    <Box>
      <Typography variant="h5">Brokers</Typography>
      <Box sx={{ my:2, display:'flex', gap:2, alignItems:'center' }}>
        <TextField label="Name" value={name} onChange={e=>setName(e.target.value)} />
        <TextField label="Initial balance" type="number" value={initial} onChange={e=>setInitial(Number(e.target.value))} />
        <Button variant="contained" onClick={addBroker}>Add</Button>
      </Box>

      <List>
        {brokers.map(b=> (
          <ListItem key={b.id} secondaryAction={
            <IconButton edge="end" onClick={()=>removeBroker(b.id)} aria-label="delete"><DeleteIcon/></IconButton>
          }>
            <ListItemText primary={b.name} secondary={`Initial: $${b.initialBalance.toFixed(2)} • Current: $${b.currentBalance.toFixed(2)}`} />
            <TextField sx={{ml:2, width:160}} label="Set initial" type="number" defaultValue={b.initialBalance} onBlur={(e)=>changeInitial(b.id, Number(e.target.value))} inputProps={{ min: 0 }} />
          </ListItem>
        ))}
      </List>
    </Box>
  )
}
