import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { List, ListItemButton, ListItemText, Box, Typography, Checkbox, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import StockChart from '../shared/StockChart'

type PricePoint = { date: string; open: number }
type Stock = { symbol: string; company: string; isActive: boolean; currentPrice: number; history: PricePoint[] }

export default function StocksPage(){
  const [stocks, setStocks] = useState<Stock[]>([])
  const [selected, setSelected] = useState<Stock|undefined>(undefined)

  useEffect(()=>{ fetchStocks() }, [])

  async function fetchStocks(){
    try{ const res = await axios.get('http://localhost:3001/stocks'); setStocks(res.data); if(res.data.length) setSelected(res.data[0]) }
    catch(err){ console.error(err) }
  }

  // Select a stock by clicking it (for viewing history). Does NOT change participation.
  function selectStock(s: Stock){
    if (selected?.symbol === s.symbol) return
    setSelected(s)
  }

  // Toggle whether a stock participates in the trading simulation (multiple allowed).
  async function toggleParticipation(e: React.MouseEvent, s: Stock){
    e.stopPropagation()
    try{
      const res = await axios.put(`http://localhost:3001/stocks/${s.symbol}`, { isActive: !s.isActive })
      const updated: Stock = res.data
      setStocks(prev => prev.map(p => p.symbol===updated.symbol? updated : p))
      if (selected?.symbol === updated.symbol) setSelected(updated)
    }catch(err){ console.error(err) }
  }

  return (
    <div className="stocks-list">
      <Box>
        <Typography variant="h6">Available Stocks</Typography>
        <List>
          {stocks.map(s=> (
            <ListItemButton key={s.symbol} className="stock-item" selected={selected?.symbol===s.symbol} onClick={()=>selectStock(s)}>
              <ListItemText primary={`${s.symbol} — ${s.company}`} secondary={`Price: $${s.currentPrice.toFixed(2)}`} />
              <Box sx={{ ml: 2 }}>
                <Checkbox
                  edge="end"
                  checked={!!s.isActive}
                  onClick={(e) => toggleParticipation(e, s)}
                  inputProps={{ 'aria-label': 'participate' }}
                />
              </Box>
            </ListItemButton>
          ))}
        </List>
      </Box>
      <Box>
        {selected ? (
          <div>
            <Typography variant="h6">{selected.symbol} — {selected.company}</Typography>
            <StockChart data={selected.history.slice().reverse()} />

            <Typography variant="subtitle1" sx={{ mt: 2 }}>Historical data (table)</Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 320, mt: 1 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Open</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selected.history.map((p) => (
                    <TableRow key={p.date} hover>
                      <TableCell component="th" scope="row">{p.date}</TableCell>
                      <TableCell align="right">${p.open.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        ) : (
          <Typography>Select a stock to view history</Typography>
        )}
      </Box>
    </div>
  )
}
