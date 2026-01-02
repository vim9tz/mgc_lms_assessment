'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import { CardActions, CardMedia, Collapse, IconButton } from '@mui/material'
import ToastsPromise from './Notify'

const HeroCard = () => {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className='grid grid-cols-2 gap-10'>
      {/* Main Card */}
      <div className='col-span-2'>
        <Card className="rounded-3xl relative group overflow-hidden">
          <CardMedia image="/images/events/Main_cover_event.png" className="bs-[585px]" />

          {/* Overlay (Hidden by default, shown on hover) */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <ToastsPromise />
          </div>

          <CardContent className="absolute bottom-0 pb-0 w-full z-10 bg-black/40 backdrop-blur-lg transition-all duration-300">
            <Typography variant="h3" className="mbe-3 font-bold text-white">
              Popular Uses Of The Internet
            </Typography>
            <Typography className="text-slate-200">
              Although cards can support multiple actions, UI controls, and an overflow menu.
            </Typography>
            <CardActions className="justify-between card-actions-dense p-0 pb-2">
              <Button className="p-0 text-left flex justify-start" onClick={() => setExpanded(!expanded)}>
                Details
              </Button>
              <IconButton onClick={() => setExpanded(!expanded)}>
                <i className={`text-primary ${expanded ? "tabler-chevron-up" : "tabler-chevron-down"}`} />
              </IconButton>
            </CardActions>
            <Collapse in={expanded} timeout={300}>
              <Divider />
              <CardContent className="bg-white/50 rounded-xl mb-4 min-h-fit max-h-[40vh] overflow-y-auto">
                <Typography className="text-slate-100">
                  I'm a thing. But, like most politicians, he promised more than he could deliver. You won't have time
                  for sleeping, soldier, not with all the bed-making you'll be doing. Then we'll go with that data
                  file! Hey, you add a one and two zeros to that or we walk! You're going to do his laundry? I've got
                  to find a way to escape.
                </Typography>
              </CardContent>
            </Collapse>
          </CardContent>
        </Card>
      </div>
      {/* Lifetime Membership Card 1 */}
      <Card className="h-fit rounded-3xl group overflow-hidden relative">
        <Grid container>
          <Grid item xs={12} sm={7}>
            <CardContent>
              <Typography variant="h5" className="mbe-2">
                Lifetime Membership
              </Typography>
              <Typography color="text.secondary">
                Here, I focus on a range of items and features that we use in life without giving them a second thought,
                such as Coca Cola, body muscles, and holding one's own breath. Though most of these notes are not
                fundamentally necessary,
              </Typography>
              <Divider className="mbs-7 mbe-7" />
              <Grid container>
                <Grid item xs={12} sm={6} className="flex flex-col pie-5 gap-[26px]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-calendar-stats text-xl text-success" />
                    </div>
                    <Typography color="text.secondary">20-10-2030</Typography>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-assembly text-xl text-primary" />
                    </div>
                    <Typography color="text.secondary">Coding</Typography>
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} className="flex flex-col max-sm:mbs-[26px] sm:pis-5 sm:border-is gap-[26px]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-calendar-x text-xl text-error" />
                    </div>
                    <Typography color="text.secondary">30-10-2030</Typography>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-clipboard-list text-xl text-warning" />
                    </div>
                    <Typography color="text.secondary">Python</Typography>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Grid>

          {/* Image Section with Hover Effect */}
          <Grid item xs={12} sm={5} className="relative overflow-hidden">
            <CardContent className="flex items-center p-0 justify-center bs-full bg-actionHover relative">
              {/* Image Wrapper for Scaling Effect */}
              <div className="relative w-full h-full overflow-hidden">
                <img
                  className="object-cover w-full h-full transition-transform duration-300 ease-out scale-100 group-hover:scale-110"
                  src="/images/events/python_event_cover.webp"
                  alt="Python Event"
                />
              </div>

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/10  backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <ToastsPromise />
              </div>
            </CardContent>
          </Grid>
        </Grid>
      </Card>



      {/* Lifetime Membership Card 2 */}
      <Card className="h-fit rounded-3xl group overflow-hidden relative">
        <Grid container>
          <Grid item xs={12} sm={7}>
            <CardContent>
              <Typography variant="h5" className="mbe-2">
                Lifetime Membership
              </Typography>
              <Typography color="text.secondary">
                Here, I focus on a range of items and features that we use in life without giving them a second thought,
                such as Coca Cola, body muscles, and holding one's own breath. Though most of these notes are not
                fundamentally necessary,
              </Typography>
              <Divider className="mbs-7 mbe-7" />
              <Grid container>
                <Grid item xs={12} sm={6} className="flex flex-col pie-5 gap-[26px]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-calendar-stats text-xl text-success" />
                    </div>
                    <Typography color="text.secondary">20-10-2030</Typography>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-assembly text-xl text-primary" />
                    </div>
                    <Typography color="text.secondary">Coding</Typography>
                  </div>
                </Grid>
                <Grid item xs={12} sm={6} className="flex flex-col max-sm:mbs-[26px] sm:pis-5 sm:border-is gap-[26px]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-calendar-x text-xl text-error" />
                    </div>
                    <Typography color="text.secondary">30-10-2030</Typography>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      <i className="tabler-clipboard-list text-xl text-warning" />
                    </div>
                    <Typography color="text.secondary">Python</Typography>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Grid>

          {/* Image Section with Hover Effect */}
          <Grid item xs={12} sm={5} className="relative overflow-hidden">
            <CardContent className="flex items-center p-0 justify-center bs-full bg-actionHover relative">
              {/* Image Wrapper for Scaling Effect */}
              <div className="relative w-full h-full overflow-hidden">
                <img
                  className="object-cover w-full h-full transition-transform duration-300 ease-out scale-100 group-hover:scale-110"
                  src='/images/events/AI_event_cover.webp'
                  alt="Python Event"
                />
              </div>

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <ToastsPromise />
              </div>
            </CardContent>
          </Grid>
        </Grid>
      </Card>
      <Card>
                <svg className='w-full h-full' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 500"><title>bg-grid-dotted-wide-2</title><defs><radialGradient cx="50.3533435%" cy="90.5912249%" fx="50.3533435%" fy="90.5912249%" r="184.257145%" gradientTransform="translate(0.5035, 0.9059), scale(0.2348, 1), scale(1, 0.4119), translate(-0.5035, -0.9059)" id="radialGradient-1"><stop stopColor="#71717A" offset="0%"></stop><stop stopColor="#FFFFFF" offset="100%"></stop></radialGradient></defs><g id="bg-grid-dotted-wide-2" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" opacity="0.25" strokeDasharray="3.287617680398781,5.728673808094876" strokeLinecap="round" strokeLinejoin="round"><path d="M388.121104,200.49103 L307.579112,500 M291.362758,200.49103 L90.7027404,500 M194.604411,200.49103 L-126.173631,500 M97.8460651,200.49103 L-343.050003,500 M1.08771884,200.49103 L-559.926374,500 M-95.6706274,200.49103 L-776.802745,500 M-829.908779,467.023761 L453,467.023761 M-617.587191,388.969908 L452.999884,388.969908 M-418.927906,310.916055 L452.999806,310.916055 M-233.930928,232.862202 L452.99976,232.862202 M1002.33626,200.49103 L1684.29503,500 M905.577917,200.49103 L1467.41865,500 M808.819571,200.49103 L1250.54228,500 M712.061224,200.49103 L1033.66591,500 M615.302878,200.49103 L816.78954,500 M518.544532,200.49103 L599.913168,500 M453,467.023761 L1735.90878,467.023761 M452.999884,388.969908 L1523.58696,388.969908 M452.999806,310.916055 L1324.92752,310.916055 M452.99976,232.862202 L1139.93045,232.862202 M388.121104,197 L386.84993,-102.50897 M291.362758,197 L288.195691,-102.50897 M194.604411,197 L189.541452,-102.50897 M97.8460651,197 L90.8872123,-102.50897 M1.08771884,197 L-7.76702705,-102.50897 M-95.6706274,197 L-106.421266,-102.50897 M-207.575477,-69.5327306 L453,-69.5327306 M-250.337495,8.52112242 L452.999924,8.52112242 M-243.691314,86.5749755 L452.999845,86.5749755 M-193.45953,164.628829 L452.999774,164.628829 M1002.33626,197 L1013.10009,-102.50897 M905.577917,197 L914.445846,-102.50897 M808.819571,197 L815.791606,-102.50897 M712.061224,197 L717.137367,-102.50897 M615.302878,197 L618.483128,-102.50897 M518.544532,197 L519.828889,-102.50897 M453,-69.5327306 L1113.57548,-69.5327306 M452.999924,8.52112242 L1156.33734,8.52112242 M452.999845,86.5749755 L1149.691,86.5749755 M452.999774,164.628829 L1099.45908,164.628829" id="Combined-Shape" stroke="url(#radialGradient-1)" strokeWidth="1.23285663"></path></g></svg>
      </Card>
    </div>
  )
}

export default HeroCard
