import React from 'react'
// MUI imports
import MenuItem from '@mui/material/MenuItem'
import { FormControl, Select } from '@mui/material'

function SelectModule() {
  return (
    <FormControl size="small" className="w-32 flex-auto ml-1" sx={{ border: 'none' }}>
      <Select
        className="w-32"
        id="select-course"
        value={'All'}
        labelId="course-select"
        sx={{
          border: 'none',
          boxShadow: 'none !important', // Force removes any box-shadow
          backgroundColor: 'transparent', // Ensures background doesn't change
          '& fieldset': { border: 'none' }, // Removes border from fieldset
          '&:focus': { outline: 'none', boxShadow: 'none', backgroundColor: 'transparent' }, // Removes focus outline
          '&.Mui-focused': {
            outline: 'none',
            boxShadow: 'none !important', // Force removes focus shadow
            backgroundColor: 'transparent'
          },
          '&:active': { outline: 'none', boxShadow: 'none', backgroundColor: 'transparent' }, // Removes active state
          '&.Mui-active': { outline: 'none', boxShadow: 'none', backgroundColor: 'transparent' }, // Extra rule for active state
          '&.MuiOutlinedInput-root': {
            border: 'none',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            '&:hover': { border: 'none', backgroundColor: 'transparent' },
            '&.Mui-focused': { border: 'none', boxShadow: 'none', backgroundColor: 'transparent' }
          },
          '& .MuiSelect-select': {
            backgroundColor: 'transparent !important',
            boxShadow: 'none !important',
          },
          '& .MuiOutlinedInput-notchedOutline': { border: 'none !important' }, // Force removes outline
          '&::after': { // Removes MUI's focus ripple effect (important for click shadow)
            boxShadow: 'none !important',
            border: 'none !important',
            outline: 'none !important',
            backgroundColor: 'transparent !important'
          },
          // Explicitly remove the shadow from the specific MUI-generated class in the DOM
          '&.MuiInputBase-colorPrimary.Mui-focused': {
            boxShadow: 'none !important',
          }
        }}
      >
        <MenuItem value="All">All Courses</MenuItem>
        <MenuItem value="Web">Web</MenuItem>
        <MenuItem value="Art">Art</MenuItem>
        <MenuItem value="UI/UX">UI/UX</MenuItem>
        <MenuItem value="Psychology">Psychology</MenuItem>
        <MenuItem value="Design">Design</MenuItem>
      </Select>
    </FormControl>
  )
}

export default SelectModule
