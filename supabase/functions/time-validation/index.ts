import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { clientTime } = await req.json()
    
    if (!clientTime) {
      return new Response(
        JSON.stringify({ error: 'clientTime is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const serverTime = new Date()
    const clientTimeDate = new Date(clientTime)
    
    // Calcular diferença em milissegundos
    const timeDifference = Math.abs(serverTime.getTime() - clientTimeDate.getTime())
    
    // Permitir diferença de até 5 minutos (300000ms)
    const maxAllowedDifference = 5 * 60 * 1000
    const isTimeValid = timeDifference <= maxAllowedDifference
    
    // Log da validação para auditoria
    console.log('Time validation:', {
      serverTime: serverTime.toISOString(),
      clientTime: clientTimeDate.toISOString(),
      difference: timeDifference,
      isValid: isTimeValid,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || 'unknown'
    })

    // Se a diferença for muito grande, registrar como possível tentativa de burla
    if (!isTimeValid) {
      console.warn('Possible time manipulation attempt detected:', {
        serverTime: serverTime.toISOString(),
        clientTime: clientTimeDate.toISOString(),
        difference: timeDifference,
        userAgent: req.headers.get('user-agent'),
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      })
    }

    return new Response(
      JSON.stringify({
        serverTime: serverTime.toISOString(),
        clientTime: clientTimeDate.toISOString(),
        timeDifference,
        isTimeValid,
        maxAllowedDifference,
        warning: !isTimeValid ? 'Time discrepancy detected. Please correct your device time.' : null
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in time-validation function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})