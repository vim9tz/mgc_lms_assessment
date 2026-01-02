'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'

// Component Imports

const PricingPage = ({ data }: { data?: PricingPlanType[] }) => {
  return (
    <Card>
      <CardContent className='xl:!plb-16 xl:pli-[6.25rem] pbs-10 pbe-5 pli-5 sm:p-16'>
        <div>
          pricing page
        </div>
      </CardContent>
    </Card>
  )
}

export default PricingPage
