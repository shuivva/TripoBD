import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MapView from '../components/MapView'
import { getRoutes } from '../apiClient'

/* ═══════════════════════ COORDINATES ═══════════════════════ */
const COORDS = {
  'Dhaka':         [23.8103, 90.4125],
  "Cox's Bazar":   [21.4272, 92.0058],
  'Sundarbans':    [22.0,    89.0   ],
  'Sajek Valley':  [23.3851, 92.0195],
  'Sylhet':        [24.8949, 91.8687],
  'Sreemangal':    [24.3067, 91.7294],
  'Bandarban':     [22.1953, 92.2185],
  'Rangamati':     [22.6556, 92.1935],
  'Kuakata':       [21.8327, 90.1207],
  'Saint Martin':  [20.6267, 92.3224],
  'Chittagong':    [22.3569, 91.7832],
  'Khulna':        [22.8456, 89.5403],
  'Teknaf':        [20.8618, 92.2987],
  'Rajshahi':      [24.3745, 88.6042],
  'Paharpur':      [25.0269, 88.6741],
  'Barisal':       [22.7010, 90.3535],
  'Rangpur':       [25.7439, 89.2752],
  'Mymensingh':    [24.7471, 90.4275],
  'Comilla':       [23.4607, 91.1809],
  'Jessore':       [23.1708, 89.2079],
  'Jaflong':       [25.1667, 92.2167],
  'Ratargul':      [25.0500, 91.9000],
  'Bogra':         [24.8510, 89.3700],
  'Narayanganj':   [23.6238, 90.4996],
  'Tangail':       [24.2513, 89.9167],
  'Faridpur':      [23.6070, 89.8430],
  'Noakhali':      [22.8696, 91.0993],
  'Manikganj':     [23.8640, 90.0017],
  'Narsingdi':     [23.9258, 90.7153],
  'Kaptai':        [22.4997, 92.2182],
  'Chandpur':      [23.2332, 90.6518],
  'Hatiya':        [22.3600, 91.1100],
  'Mongla':        [22.4833, 89.5833],
}

const MODE_ICON = { Bus: '🚌', Train: '🚂', Launch: '⛵', Air: '✈️', Mixed: '🔀' }

/* ═══════════════════════ BASE ROUTES ═══════════════════════ */
const baseRoutes = [
  // ── Dhaka → Cox's Bazar ──
  { from:'Dhaka', to:"Cox's Bazar", mode:'Bus',   operator:'Green Line Paribahan',  fare:1200, duration:'10h',  departure:'22:00', travelClass:'Volvo AC',    tips:'Overnight bus. Carry a light jacket for AC comfort.' },
  { from:'Dhaka', to:"Cox's Bazar", mode:'Bus',   operator:'Shyamoli NR Travel',    fare:1100, duration:'11h',  departure:'20:30', travelClass:'AC Business', tips:'Traffic heavy; depart after 8 PM for best conditions.' },
  { from:'Dhaka', to:"Cox's Bazar", mode:'Air',   operator:'US-Bangla Airlines',    fare:4500, duration:'1h',   departure:'10:00', travelClass:'Economy',     tips:'Arrive 2 hours early. Airport is 20 min from beach.' },
  { from:'Dhaka', to:"Cox's Bazar", mode:'Air',   operator:'Biman Bangladesh',      fare:4800, duration:'1h',   departure:'08:00', travelClass:'Economy',     tips:'Direct flight. Best booked 2 weeks ahead.' },

  // ── Dhaka → Sundarbans ──
  { from:'Dhaka', to:'Sundarbans',  mode:'Launch', operator:'Sundarban Tour Boat',  fare:3500, duration:'14h', departure:'18:00', travelClass:'Cabin',       tips:'Pack light and carry motion sickness medicine.' },
  { from:'Dhaka', to:'Sundarbans',  mode:'Mixed',  operator:'Bus + Launch',          fare:2200, duration:'12h', departure:'07:00', travelClass:'Standard',    tips:'Bus to Khulna, then evening launch into the forest.' },

  // ── Dhaka → Sajek Valley ──
  { from:'Dhaka', to:'Sajek Valley',mode:'Bus',   operator:'Shyamoli NR Travel',   fare:900,  duration:'12h', departure:'20:30', travelClass:'AC',          tips:'Roads winding. Take motion sickness pills. Last leg via Chander Gari.' },
  { from:'Dhaka', to:'Sajek Valley',mode:'Mixed', operator:'Bus + Chander Gari',   fare:1100, duration:'14h', departure:'18:00', travelClass:'Standard',    tips:'Stop overnight in Khagrachhari for a more relaxed pace.' },

  // ── Dhaka → Sylhet ──
  { from:'Dhaka', to:'Sylhet',      mode:'Train', operator:'Parabat Express',       fare:400,  duration:'5h',  departure:'07:00', travelClass:'Shovan',      tips:'Sit on the right side for tea garden views.' },
  { from:'Dhaka', to:'Sylhet',      mode:'Train', operator:'Upaban Express',        fare:600,  duration:'6h',  departure:'22:00', travelClass:'Snigdha AC',  tips:'Overnight train, comfortable and scenic.' },
  { from:'Dhaka', to:'Sylhet',      mode:'Air',   operator:'US-Bangla Airlines',    fare:3800, duration:'45m', departure:'15:00', travelClass:'Economy',     tips:'Osmani Airport is close to the city.' },
  { from:'Dhaka', to:'Sylhet',      mode:'Bus',   operator:'Ena Transport',         fare:700,  duration:'7h',  departure:'08:00', travelClass:'AC',          tips:'Comfortable coaches depart from Sayedabad terminal.' },

  // ── Dhaka → Sreemangal ──
  { from:'Dhaka', to:'Sreemangal',  mode:'Train', operator:'Parabat Express',       fare:350,  duration:'4.5h',departure:'07:00', travelClass:'Shovan',      tips:'Beautiful route. Get down at Sreemangal station.' },
  { from:'Dhaka', to:'Sreemangal',  mode:'Bus',   operator:'Hanif Enterprise',      fare:450,  duration:'5h',  departure:'09:00', travelClass:'AC',          tips:'Bus to Sylhet road, exit at Sreemangal junction.' },

  // ── Dhaka → Bandarban ──
  { from:'Dhaka', to:'Bandarban',   mode:'Bus',   operator:'S. Alam Paribahan',     fare:1000, duration:'9h',  departure:'21:00', travelClass:'AC',          tips:'Foreigners need a permit from Chittagong DC office.' },
  { from:'Dhaka', to:'Bandarban',   mode:'Mixed', operator:'Train + Local Bus',      fare:900,  duration:'10h', departure:'06:30', travelClass:'Standard',    tips:'Train to Chittagong, then bus to Bandarban.' },

  // ── Dhaka → Rangamati ──
  { from:'Dhaka', to:'Rangamati',   mode:'Bus',   operator:'Desh Travels',          fare:950,  duration:'8h',  departure:'22:00', travelClass:'AC',          tips:'Permit required for foreigners. Beautiful lake views.' },

  // ── Dhaka → Kuakata ──
  { from:'Dhaka', to:'Kuakata',     mode:'Bus',   operator:'Hanif Enterprise',      fare:850,  duration:'11h', departure:'20:00', travelClass:'AC',          tips:'Best to visit in winter. See both sunrise and sunset.' },
  { from:'Dhaka', to:'Kuakata',     mode:'Launch',operator:'BIWTC Launch',          fare:600,  duration:'13h', departure:'18:00', travelClass:'Deck',        tips:'Scenic river launch via Barisal route. Budget option.' },

  // ── Dhaka → Saint Martin ──
  { from:'Dhaka', to:'Saint Martin',mode:'Mixed', operator:'Bus + Ferry',           fare:2200, duration:'14h', departure:'08:00', travelClass:'Standard',    tips:'Bus to Teknaf, then ferry. Schedule depends on weather.' },

  // ── Dhaka → Rajshahi ──
  { from:'Dhaka', to:'Rajshahi',    mode:'Train', operator:'Padma Express',         fare:650,  duration:'7h',  departure:'07:00', travelClass:'Snigdha',     tips:'Comfortable AC train. Great mangoes in summer season!' },
  { from:'Dhaka', to:'Rajshahi',    mode:'Bus',   operator:'Shyamoli Paribahan',    fare:550,  duration:'6h',  departure:'08:00', travelClass:'AC',          tips:'Fast highway route, several departures daily.' },
  { from:'Dhaka', to:'Rajshahi',    mode:'Air',   operator:'NovoAir',               fare:3500, duration:'50m', departure:'14:00', travelClass:'Economy',     tips:'Short flight. Shah Makhdum Airport in Rajshahi.' },

  // ── Dhaka → Chittagong ──
  { from:'Dhaka', to:'Chittagong',  mode:'Train', operator:'Subarna Express',       fare:600,  duration:'6h',  departure:'06:30', travelClass:'Snigdha',     tips:'Fastest train. Beautiful river crossing on the way.' },
  { from:'Dhaka', to:'Chittagong',  mode:'Train', operator:'Turna Nishita',         fare:550,  duration:'7h',  departure:'23:00', travelClass:'Shovan',      tips:'Night train, arrives early morning. Very popular.' },
  { from:'Dhaka', to:'Chittagong',  mode:'Air',   operator:'NovoAir',               fare:4000, duration:'50m', departure:'11:00', travelClass:'Economy',     tips:'Frequent flights. Shah Amanat Airport near city.' },
  { from:'Dhaka', to:'Chittagong',  mode:'Bus',   operator:'S. Alam Paribahan',     fare:700,  duration:'5h',  departure:'08:00', travelClass:'AC',          tips:'Highway express with multiple daily departures.' },

  // ── Dhaka → Khulna ──
  { from:'Dhaka', to:'Khulna',      mode:'Train', operator:'Chitra Express',        fare:500,  duration:'7h',  departure:'08:00', travelClass:'Snigdha',     tips:'Comfortable ride. Beautiful river crossing en route.' },
  { from:'Dhaka', to:'Khulna',      mode:'Launch',operator:'MV Oronanya',           fare:800,  duration:'18h', departure:'18:00', travelClass:'Cabin',       tips:'Scenic river journey overnight. Very comfortable cabin.' },
  { from:'Dhaka', to:'Khulna',      mode:'Bus',   operator:'Shyamoli NR',           fare:600,  duration:'7h',  departure:'07:00', travelClass:'AC',          tips:'Regular highway buses, several daily departures.' },

  // ── Dhaka → Barisal ──
  { from:'Dhaka', to:'Barisal',     mode:'Launch',operator:'MV Kirtankhola',        fare:700,  duration:'12h', departure:'20:00', travelClass:'Cabin',       tips:'Classic Bangladesh river journey. Deck cheaper option.' },
  { from:'Dhaka', to:'Barisal',     mode:'Bus',   operator:'Hanif Enterprise',      fare:500,  duration:'6h',  departure:'09:00', travelClass:'AC',          tips:'Faster than launch. Crosses Padma Bridge.' },
  { from:'Dhaka', to:'Barisal',     mode:'Air',   operator:'US-Bangla Airlines',    fare:3500, duration:'45m', departure:'09:00', travelClass:'Economy',     tips:'Quick flight. Airport about 10 min from city.' },

  // ── Dhaka → Rangpur ──
  { from:'Dhaka', to:'Rangpur',     mode:'Bus',   operator:'Nabil Paribahan',       fare:800,  duration:'8h',  departure:'22:00', travelClass:'AC',          tips:'Overnight bus is most convenient option.' },
  { from:'Dhaka', to:'Rangpur',     mode:'Train', operator:'Rangpur Express',       fare:550,  duration:'9h',  departure:'06:00', travelClass:'Shovan',      tips:'Scenic journey through north Bengal countryside.' },

  // ── Dhaka → Mymensingh ──
  { from:'Dhaka', to:'Mymensingh',  mode:'Train', operator:'Brahmputra Express',    fare:200,  duration:'2.5h',departure:'07:30', travelClass:'Shovan',      tips:'Short comfortable train, very popular route.' },
  { from:'Dhaka', to:'Mymensingh',  mode:'Bus',   operator:'BRTC',                  fare:180,  duration:'3h',  departure:'08:00', travelClass:'Local',       tips:'Frequent buses from Mohakhali terminal.' },

  // ── Dhaka → Bogra ──
  { from:'Dhaka', to:'Bogra',       mode:'Bus',   operator:'Shyamoli Paribahan',    fare:500,  duration:'5h',  departure:'08:00', travelClass:'AC',          tips:'Stop at Bogra to visit Mahasthangarh ruins nearby.' },
  { from:'Dhaka', to:'Bogra',       mode:'Train', operator:'Lalmoni Express',       fare:400,  duration:'6h',  departure:'10:00', travelClass:'Shovan',      tips:'Train passes through Jamuna bridge — great views.' },

  // ── Dhaka → Comilla ──
  { from:'Dhaka', to:'Comilla',     mode:'Bus',   operator:'Tisha Enterprise',      fare:300,  duration:'2h',  departure:'08:00', travelClass:'AC',          tips:'Very frequent service from Sayedabad terminal.' },
  { from:'Dhaka', to:'Comilla',     mode:'Train', operator:'Mahanagar Provati',     fare:250,  duration:'2.5h',departure:'07:40', travelClass:'Shovan',      tips:'Comfortable train, passes Buriganga river.' },

  // ── Chittagong → Cox's Bazar ──
  { from:'Chittagong', to:"Cox's Bazar", mode:'Bus',  operator:'City Line',         fare:450,  duration:'4h',  departure:'08:00', travelClass:'Non-AC',      tips:'Marine drive route is scenic but takes longer.' },
  { from:'Chittagong', to:"Cox's Bazar", mode:'Bus',  operator:'Green Line',        fare:600,  duration:'4.5h',departure:'09:00', travelClass:'AC',          tips:'Regular route via Chokoria is faster.' },

  // ── Chittagong → Rangamati ──
  { from:'Chittagong', to:'Rangamati',  mode:'Bus',   operator:'BRTC',              fare:250,  duration:'2.5h',departure:'10:00', travelClass:'AC',          tips:'Beautiful road alongside Kaptai Lake.' },

  // ── Chittagong → Bandarban ──
  { from:'Chittagong', to:'Bandarban',  mode:'Bus',   operator:'Purbani Paribahan', fare:300,  duration:'3h',  departure:'09:00', travelClass:'Local',       tips:'Local buses leave from Oxygen Square.' },

  // ── Chittagong → Sajek Valley ──
  { from:'Chittagong', to:'Sajek Valley',mode:'Mixed',operator:'Bus + Chander Gari',fare:700,  duration:'6h',  departure:'07:00', travelClass:'Standard',    tips:'Via Khagrachhari. Jeep required for last stretch.' },

  // ── Sylhet → Sreemangal ──
  { from:'Sylhet', to:'Sreemangal',   mode:'Train', operator:'Paharika Express',    fare:150,  duration:'2h',  departure:'11:00', travelClass:'Shovan',      tips:'Short scenic train through tea estates.' },
  { from:'Sylhet', to:'Sreemangal',   mode:'Bus',   operator:'Local Bus',           fare:120,  duration:'2.5h',departure:'09:00', travelClass:'Local',       tips:'Frequent buses, get off at Sreemangal crossing.' },

  // ── Sylhet → Jaflong ──
  { from:'Sylhet', to:'Jaflong',      mode:'Mixed', operator:'CNG / Shared Car',    fare:500,  duration:'2h',  departure:'08:00', travelClass:'Private',     tips:'Visit zero point and stone collection areas.' },

  // ── Sylhet → Ratargul ──
  { from:'Sylhet', to:'Ratargul',     mode:'Mixed', operator:'CNG + Boat',          fare:400,  duration:'1.5h',departure:'09:00', travelClass:'Private',     tips:'Short boat ride into the swamp forest. Magical.' },

  // ── Khulna → Sundarbans ──
  { from:'Khulna', to:'Sundarbans',   mode:'Launch',operator:'Mongla Ferries',      fare:2500, duration:'8h',  departure:'07:00', travelClass:'Tourist',     tips:'Tourist launches from Rupsa Ghat. Multi-day tours recommended.' },
  { from:'Khulna', to:'Sundarbans',   mode:'Launch',operator:'Sundarban Hillsa Cruise',fare:4500,duration:'6h',departure:'08:00', travelClass:'Premium',    tips:'Premium cruise with wildlife guide and meals included.' },

  // ── Khulna → Barisal ──
  { from:'Khulna', to:'Barisal',      mode:'Launch',operator:'BIWTC',               fare:300,  duration:'6h',  departure:'06:00', travelClass:'Deck',        tips:'Classic river route through mangrove delta.' },

  // ── Teknaf → Saint Martin ──
  { from:'Teknaf', to:'Saint Martin', mode:'Launch',operator:'Keari Sindbad',       fare:1200, duration:'3h',  departure:'09:00', travelClass:'Tourist',     tips:'Buy tickets a day in advance during peak season.' },
  { from:'Teknaf', to:'Saint Martin', mode:'Launch',operator:'Speed Boat (shared)', fare:2000, duration:'1.5h',departure:'10:00', travelClass:'Express',    tips:'Faster option in rough weather season.' },

  // ── Rajshahi → Paharpur ──
  { from:'Rajshahi', to:'Paharpur',   mode:'Mixed', operator:'Local Bus/Rickshaw',  fare:400,  duration:'3h',  departure:'07:00', travelClass:'Local',       tips:'Visit UNESCO Somapura Mahavihara early to avoid heat.' },
  { from:'Rajshahi', to:'Bogra',      mode:'Bus',   operator:'Hanif Enterprise',    fare:200,  duration:'2h',  departure:'09:00', travelClass:'Local',       tips:'Frequent connection, good base for north Bengal tour.' },

  // ── Chittagong → Noakhali ──
  { from:'Chittagong', to:'Noakhali', mode:'Bus',   operator:'Sonar Bangla',        fare:250,  duration:'2h',  departure:'08:00', travelClass:'Local',       tips:'Gateway to Hatiya Island boat trips.' },

  // ── Barisal → Kuakata ──
  { from:'Barisal', to:'Kuakata',     mode:'Bus',   operator:'Local Bus',           fare:200,  duration:'3h',  departure:'08:00', travelClass:'Local',       tips:'Last stretch via Patuakhali. Worth the ride.' },
  { from:'Barisal', to:'Kuakata',     mode:'Mixed', operator:'Launch + Bus',        fare:350,  duration:'4h',  departure:'07:00', travelClass:'Standard',    tips:'Scenic river section before road to Kuakata.' },

  // ── Mymensingh → Tangail ──
  { from:'Mymensingh', to:'Tangail',  mode:'Bus',   operator:'Local Bus',           fare:150,  duration:'2h',  departure:'09:00', travelClass:'Local',       tips:'Access to Madhupura tea estate from Tangail.' },

  // ── Dhaka → Narayanganj ──
  { from:'Dhaka', to:'Narayanganj',   mode:'Launch',operator:'Local Launch',        fare:60,   duration:'2h',  departure:'10:00', travelClass:'Deck',        tips:'Classic river town trip. See the old riverfront.' },
  { from:'Dhaka', to:'Narayanganj',   mode:'Train', operator:'Narayanganj Local',   fare:40,   duration:'1h',  departure:'08:00', travelClass:'Local',       tips:'Cheapest and fastest option from Dhaka station.' },
]

/* ═══════════════════════ GENERATE BIDIRECTIONAL ═══════════════════════ */
const modes = ['Bus', 'Train', 'Launch', 'Air', 'Mixed']

const POPULAR = [
  { label: 'Dhaka → Cox\'s Bazar', from: 'Dhaka',     to: "Cox's Bazar"  },
  { label: 'Dhaka → Sundarbans',   from: 'Dhaka',     to: 'Sundarbans'   },
  { label: 'Dhaka → Sajek Valley', from: 'Dhaka',     to: 'Sajek Valley' },
  { label: 'Dhaka → Sylhet',       from: 'Dhaka',     to: 'Sylhet'       },
  { label: 'Dhaka → Chittagong',   from: 'Dhaka',     to: 'Chittagong'   },
  { label: 'Dhaka → Khulna',       from: 'Dhaka',     to: 'Khulna'       },
  { label: 'Dhaka → Rajshahi',     from: 'Dhaka',     to: 'Rajshahi'     },
  { label: 'Dhaka → Kuakata',      from: 'Dhaka',     to: 'Kuakata'      },
  { label: 'Chittagong → Cox\'s Bazar', from:'Chittagong', to:"Cox's Bazar" },
  { label: 'Khulna → Sundarbans',  from: 'Khulna',    to: 'Sundarbans'   },
  { label: 'Teknaf → Saint Martin',from: 'Teknaf',    to: 'Saint Martin' },
  { label: 'Sylhet → Sreemangal',  from: 'Sylhet',    to: 'Sreemangal'   },
]

const travelPerks = [
  { icon: '🛡️', title: 'Verified Operators', desc: 'All transport partners vetted for safety and reliability.' },
  { icon: '💰', title: 'Best Price Guarantee', desc: 'Lowest fares across bus, train, launch, and air.' },
  { icon: '📍', title: 'Live Route Map', desc: 'See your route on an interactive map before you book.' },
]

export default function Routes() {
  const navigate = useNavigate()
  const [from, setFrom] = useState('Dhaka')
  const [to,   setTo  ] = useState("Cox's Bazar")
  const [mode, setMode] = useState('Bus')
  const [showFromSugg, setShowFromSugg] = useState(false)
  const [showToSugg,   setShowToSugg  ] = useState(false)

  const [dbRoutes, setDbRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoutes()
      .then(data => {
        setDbRoutes(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load routes from backend:", err)
        setLoading(false)
      })
  }, [])

  const transportOptions = useMemo(() => {
    const raw = dbRoutes.length ? dbRoutes : baseRoutes
    const routes = []
    let id = 1
    raw.forEach(r => {
      const fromVal = r.from || r.from_location
      const toVal = r.to || r.to_location
      const fc = COORDS[fromVal] || [23.8, 90.4]
      const tc = COORDS[toVal]   || [23.8, 90.4]

      const normalizedRoute = {
        ...r,
        from: fromVal,
        to: toVal,
        id: r.id || id++,
        path: [fc, tc]
      }
      routes.push(normalizedRoute)

      routes.push({
        ...normalizedRoute,
        id: r.id ? `rev-${r.id}` : id++,
        from: toVal,
        to: fromVal,
        path: [tc, fc],
        departure: r.departure ? `${(parseInt(r.departure.split(':')[0], 10) + 6) % 24}:${r.departure.split(':')[1]}` : '12:00',
        tips: `Return: ${r.tips || ''}`,
      })
    })
    return routes
  }, [dbRoutes])

  const uniqueFrom = useMemo(() => [...new Set(transportOptions.map(r => r.from).filter(Boolean))].sort(), [transportOptions])
  const uniqueTo   = useMemo(() => [...new Set(transportOptions.map(r => r.to  ).filter(Boolean))].sort(), [transportOptions])

  const fromSugg = useMemo(() => {
    if (!from) return uniqueFrom.slice(0, 6)
    return uniqueFrom.filter(l => l.toLowerCase().includes(from.toLowerCase())).slice(0, 6)
  }, [from, uniqueFrom])

  const toSugg = useMemo(() => {
    if (!to) return uniqueTo.slice(0, 6)
    return uniqueTo.filter(l => l.toLowerCase().includes(to.toLowerCase())).slice(0, 6)
  }, [to, uniqueTo])

  const results = useMemo(() => transportOptions.filter(r => {
    const mf = r.from.toLowerCase().includes(from.toLowerCase())
    const mt = r.to.toLowerCase().includes(to.toLowerCase())
    const mm = mode === 'Mixed' ? true : r.mode === mode
    return mf && mt && mm
  }), [from, to, mode])

  const selected = results[0] || transportOptions.find(r =>
    r.from.toLowerCase() === from.toLowerCase() &&
    r.to.toLowerCase()   === to.toLowerCase()
  )
  const path = selected?.path || []

  const pick = (f, t) => { setFrom(f); setTo(t) }

  const handleBookNow = (route) => {
    const userId = localStorage.getItem('userId')
    if (!userId) {
      alert("Please sign in to book transport tickets.")
      navigate('/signin')
      return
    }
    navigate('/traveler/bookings', { state: { route } })
  }

  return (
    <main className="page-shell page-routes">

      {/* ════ HERO ════ */}
      <section className="rt-hero">
        <div className="rt-hero-bg">
          <img src="https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Travel Route" className="rt-hero-img" />
          <div className="rt-hero-overlay" />
        </div>
        <div className="rt-hero-body">
          <span className="rt-eyebrow">Route & fare guide</span>
          <h1>Compare transport routes across Bangladesh.</h1>
          <p>Find buses, trains, launches, and flights with real-time fare comparison.</p>

          <div className="rt-search-panel">
            <div className="rt-search-row">

              {/* From */}
              <div className="rt-input-group">
                <label>From</label>
                <input value={from}
                  onChange={e => setFrom(e.target.value)}
                  onFocus={() => setShowFromSugg(true)}
                  onBlur={() => setTimeout(() => setShowFromSugg(false), 150)}
                  placeholder="Origin city…" />
                <span className="rt-input-icon">📍</span>
                {showFromSugg && fromSugg.length > 0 && (
                  <div className="rt-sugg-dropdown">
                    {fromSugg.map(loc => (
                      <button key={loc} className={`rt-sugg-item${loc.toLowerCase()===from.toLowerCase()?' rt-sugg-active':''}`}
                        onMouseDown={() => { setFrom(loc); setShowFromSugg(false) }}>
                        📍 {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rt-swap-btn" onClick={() => { const t=from; setFrom(to); setTo(t) }}>⇄</div>

              {/* To */}
              <div className="rt-input-group">
                <label>To</label>
                <input value={to}
                  onChange={e => setTo(e.target.value)}
                  onFocus={() => setShowToSugg(true)}
                  onBlur={() => setTimeout(() => setShowToSugg(false), 150)}
                  placeholder="Destination city…" />
                <span className="rt-input-icon">🏁</span>
                {showToSugg && toSugg.length > 0 && (
                  <div className="rt-sugg-dropdown">
                    {toSugg.map(loc => (
                      <button key={loc} className={`rt-sugg-item${loc.toLowerCase()===to.toLowerCase()?' rt-sugg-active':''}`}
                        onMouseDown={() => { setTo(loc); setShowToSugg(false) }}>
                        📍 {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode */}
              <div className="rt-input-group rt-input-mode">
                <label>Mode</label>
                <select value={mode} onChange={e => setMode(e.target.value)}>
                  {modes.map(m => <option key={m} value={m}>{MODE_ICON[m]} {m}</option>)}
                </select>
                <span className="rt-input-icon">🚍</span>
              </div>

              <button className="rt-search-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2.5"/>
                </svg>
                Search
              </button>
            </div>
          </div>

          {/* Mode quick-filter pills */}
          <div className="rt-mode-pills">
            {modes.map(m => (
              <button key={m}
                className={`rt-pill${mode===m?' rt-pill-active':''}`}
                onClick={() => setMode(m)}>
                {MODE_ICON[m]} {m}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════ POPULAR ROUTES ════ */}
      <section className="rt-popular">
        <div className="rt-pop-head">
          <div>
            <span className="rt-eyebrow-sm">⚡ Quick access</span>
            <h2>Popular routes</h2>
            <p>Frequently traveled paths across Bangladesh</p>
          </div>
        </div>
        <div className="rt-pop-grid">
          {POPULAR.map(item => (
            <button key={item.label}
              className={`rt-pop-card${from===item.from && to===item.to?' rt-pop-active':''}`}
              onClick={() => pick(item.from, item.to)}>
              <span className="rt-pop-from">{item.from}</span>
              <span className="rt-pop-arrow">→</span>
              <span className="rt-pop-to">{item.to}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ════ MAIN RESULTS ════ */}
      <section className="rt-main">
        <div className="rt-results">
          <div className="rt-section-intro">
            <span className="rt-eyebrow-sm">Search results</span>
            <h2>{results.length} Available Transport{results.length !== 1 ? 's' : ''}</h2>
          </div>

          {results.length ? (
            <div className="rt-cards">
              {results.map(route => (
                <article key={route.id} className="rt-card">
                  <div className="rt-card-left">
                    <span className="rt-card-mode">{MODE_ICON[route.mode]} {route.mode}</span>
                    <div className="rt-card-operator">
                      <strong>{route.operator}</strong>
                      <span>{route.travelClass}</span>
                    </div>
                  </div>
                  <div className="rt-card-center">
                    <div className="rt-card-time">
                      <strong>{route.departure}</strong>
                      <div className="rt-card-line">
                        <span className="rt-card-duration">{route.duration}</span>
                      </div>
                      <span>Drop-off</span>
                    </div>
                  </div>
                  <div className="rt-card-right">
                    <span className="rt-card-fare">৳{route.fare.toLocaleString()}</span>
                    <button className="rt-card-book" onClick={() => handleBookNow(route)}>Book Now</button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rt-empty">
              <span>🔍</span>
              <h3>No exact matches found</h3>
              <p>Try adjusting your search or selecting another transport mode.</p>
            </div>
          )}
        </div>

        <aside className="rt-sidebar">
          <div className="rt-side-card">
            <div className="rt-section-intro">
              <span className="rt-eyebrow-sm">Map view</span>
              <h2>Interactive route map</h2>
            </div>
            <div className="rt-map-wrap">
              <MapView path={path} />
            </div>
          </div>

          {selected && (
            <div className="rt-side-card">
              <div className="rt-section-intro">
                <span className="rt-eyebrow-sm">Pricing</span>
                <h2>Fare comparison</h2>
              </div>
              <div className="rt-fare-grid">
                <div className="rt-fare-item">
                  <span>Mode</span>
                  <strong>{MODE_ICON[selected.mode]} {selected.mode}</strong>
                </div>
                <div className="rt-fare-item highlight">
                  <span>Est. Fare</span>
                  <strong>৳{selected.fare.toLocaleString()}</strong>
                </div>
                <div className="rt-fare-item">
                  <span>Duration</span>
                  <strong>{selected.duration}</strong>
                </div>
              </div>
            </div>
          )}

          {selected && (
            <div className="rt-side-card">
              <div className="rt-section-intro">
                <span className="rt-eyebrow-sm">💡 Tips</span>
                <h2>Travel advice</h2>
              </div>
              <p className="rt-tips-text">{selected.tips}</p>
            </div>
          )}
        </aside>
      </section>

      {/* ════ PERKS ════ */}
      <section className="rt-perks">
        <div className="rt-section-intro centered">
          <span className="rt-eyebrow">✦ Why TripoBD</span>
          <h2>Travel with confidence</h2>
        </div>
        <div className="rt-perks-grid">
          {travelPerks.map(p => (
            <div key={p.title} className="rt-perk-card">
              <span className="rt-perk-icon">{p.icon}</span>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        /* ── HERO ── */
        .rt-hero {
          position:relative; border-radius:1.5rem; overflow:hidden;
          min-height:500px; display:flex; align-items:center; justify-content:center;
          margin-bottom:2rem; box-shadow:0 12px 48px rgba(0,0,0,.2);
        }
        .rt-hero-bg { position:absolute; inset:0; z-index:0; }
        .rt-hero-img { width:100%; height:100%; object-fit:cover; filter:brightness(.55) saturate(1.2); }
        .rt-hero-overlay {
          position:absolute; inset:0;
          background:linear-gradient(180deg,rgba(4,47,46,.85) 0%,rgba(6,10,40,.7) 100%);
        }
        .rt-hero-body {
          position:relative; z-index:2; padding:4rem 2rem;
          width:100%; max-width:960px; color:#fff;
          display:flex; flex-direction:column; align-items:center; text-align:center;
        }
        .rt-eyebrow {
          display:inline-block; margin-bottom:.5rem;
          background:linear-gradient(90deg,#38bdf8,#818cf8);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.82rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .rt-hero-body h1 { color:#fff; font-size:clamp(1.8rem,3.5vw,2.8rem); margin:.5rem 0 .75rem; font-weight:800; line-height:1.15; }
        .rt-hero-body p  { color:rgba(255,255,255,.85); font-size:1.05rem; line-height:1.6; margin-bottom:2rem; max-width:600px; }

        /* search panel */
        .rt-search-panel {
          width:100%; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.15);
          border-radius:1.5rem; padding:1.5rem; backdrop-filter:blur(12px);
          box-shadow:0 8px 32px rgba(0,0,0,.2);
        }
        .rt-search-row { display:flex; gap:1rem; align-items:flex-end; flex-wrap:wrap; }
        .rt-input-group { flex:1; min-width:120px; display:flex; flex-direction:column; text-align:left; position:relative; }
        .rt-input-group label { font-size:.7rem; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:rgba(255,255,255,.7); margin-bottom:.4rem; }
        .rt-input-group input, .rt-input-group select {
          background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
          color:#fff; font-size:.92rem; font-weight:600; border-radius:.75rem;
          padding:.7rem 1rem .7rem 2.4rem; outline:none; width:100%;
          transition:border-color .2s, background .2s;
        }
        .rt-input-group input::placeholder { color:rgba(255,255,255,.4); }
        .rt-input-group select option { background:#0f172a; color:#fff; }
        .rt-input-group input:focus, .rt-input-group select:focus { border-color:#10b981; background:rgba(255,255,255,.15); }
        .rt-input-icon { position:absolute; left:.8rem; bottom:.8rem; font-size:.95rem; pointer-events:none; }
        .rt-input-mode { flex:0.7; min-width:110px; }

        .rt-swap-btn {
          flex-shrink:0; width:38px; height:38px; border-radius:50%;
          background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
          color:#fff; font-size:1.1rem; display:flex; align-items:center;
          justify-content:center; cursor:pointer; transition:background .2s; margin-bottom:2px;
        }
        .rt-swap-btn:hover { background:rgba(255,255,255,.22); }

        .rt-search-btn {
          display:flex; align-items:center; gap:.5rem;
          background:linear-gradient(135deg,#10b981,#059669);
          color:#fff; border:none; border-radius:.75rem;
          padding:.75rem 1.4rem; font-size:.92rem; font-weight:700;
          cursor:pointer; flex-shrink:0; white-space:nowrap;
          transition:opacity .2s, transform .15s;
        }
        .rt-search-btn:hover { opacity:.88; transform:scale(1.02); }

        /* suggestions dropdown */
        .rt-sugg-dropdown {
          position:absolute; top:100%; left:0; right:0;
          background:#fff; border:1px solid #e2e8f0; border-radius:.75rem;
          margin-top:.3rem; box-shadow:0 8px 24px rgba(0,0,0,.15);
          z-index:50; overflow:hidden; max-height:220px; overflow-y:auto;
        }
        .rt-sugg-item {
          display:block; width:100%; text-align:left; padding:.55rem .75rem;
          font-size:.88rem; color:#334155; cursor:pointer; background:#fff;
          border:none; font-weight:500; transition:background .15s;
        }
        .rt-sugg-item:hover { background:#f1f5f9; }
        .rt-sugg-active { background:#f0fdf4; color:#059669; font-weight:700; }

        /* mode pills */
        .rt-mode-pills {
          display:flex; gap:.5rem; flex-wrap:wrap; justify-content:center;
          margin-top:1.25rem;
        }
        .rt-pill {
          background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.2);
          color:rgba(255,255,255,.9); border-radius:999px; padding:.3rem .9rem;
          font-size:.82rem; cursor:pointer; transition:background .2s; font-weight:500;
        }
        .rt-pill:hover { background:rgba(255,255,255,.2); }
        .rt-pill-active {
          background:linear-gradient(135deg,#10b981,#059669) !important;
          border-color:#10b981 !important; color:#fff !important; font-weight:700;
        }

        @media(max-width:768px){
          .rt-search-panel { padding:1rem; }
          .rt-search-row { flex-direction:column; gap:.75rem; }
          .rt-swap-btn { align-self:center; transform:rotate(90deg); margin:0; }
          .rt-hero { min-height:auto; }
          .rt-hero-body { padding:2.5rem 1.25rem; }
        }

        /* ── POPULAR ROUTES ── */
        .rt-popular {
          background:var(--surface); border:1px solid var(--border);
          border-radius:var(--radius); padding:2rem;
          margin-bottom:2rem;
          box-shadow:var(--elev);
        }
        .rt-pop-head { margin-bottom:1.25rem; }
        .rt-pop-head h2 { font-size:1.3rem; font-weight:800; color:#0f172a; margin:.25rem 0 .15rem; }
        .rt-pop-head p  { font-size:.88rem; color:#94a3b8; margin:0; }
        .rt-pop-grid {
          display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:.75rem;
        }
        .rt-pop-card {
          display:flex; align-items:center; gap:.5rem;
          background:#f8fafc; border:1.5px solid #e2e8f0;
          border-radius:1rem; padding:.7rem 1rem;
          cursor:pointer; transition:all .2s; text-align:left;
          font-size:.88rem; font-weight:600; color:#334155;
        }
        .rt-pop-card:hover { background:#f0fdf4; border-color:#10b981; color:#059669; transform:translateY(-2px); }
        .rt-pop-active { background:#f0fdf4 !important; border-color:#10b981 !important; color:#059669 !important; font-weight:700; }
        .rt-pop-from { font-weight:700; color:#0f172a; }
        .rt-pop-arrow { color:#10b981; font-size:1rem; }
        .rt-pop-to { color:#475569; }

        /* ── MAIN RESULTS LAYOUT ── */
        .rt-main { display:grid; grid-template-columns:1fr 380px; gap:2rem; margin-bottom:2rem; }
        .rt-section-intro { margin-bottom:1.5rem; }
        .rt-section-intro.centered { text-align:center; }
        .rt-eyebrow-sm {
          display:inline-block; margin-bottom:.25rem;
          background:linear-gradient(90deg,#e63946,#f4a261);
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
          font-weight:700; font-size:.75rem; letter-spacing:.06em; text-transform:uppercase;
        }
        .rt-section-intro h2 { font-size:1.25rem; font-weight:700; color:#0f172a; margin:0; }
        .rt-section-intro.centered h2 { font-size:clamp(1.5rem,3vw,2.2rem); font-weight:800; }

        /* result cards */
        .rt-cards { display:flex; flex-direction:column; gap:1rem; }
        .rt-card {
          display:flex; align-items:center; gap:1.5rem;
          background:#fff; border:1.5px solid #f1f5f9;
          border-radius:1.25rem; padding:1.25rem 1.5rem;
          box-shadow:0 2px 12px rgba(0,0,0,.04);
          transition:transform .2s, box-shadow .2s, border-color .2s;
        }
        .rt-card:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(16,185,129,.1); border-color:rgba(16,185,129,.2); }
        .rt-card-left { min-width:140px; }
        .rt-card-mode {
          display:inline-block; background:linear-gradient(135deg,#e63946,#f4a261);
          color:#fff; font-size:.65rem; font-weight:700;
          padding:.2rem .55rem; border-radius:999px; margin-bottom:.35rem;
        }
        .rt-card-operator strong { display:block; font-size:.9rem; color:#0f172a; }
        .rt-card-operator span   { font-size:.78rem; color:#94a3b8; }
        .rt-card-center { flex:1; }
        .rt-card-time { display:flex; align-items:center; gap:.75rem; }
        .rt-card-time strong { font-size:1.05rem; color:#0f172a; }
        .rt-card-line { flex:1; height:1px; background:#e2e8f0; position:relative; display:flex; align-items:center; justify-content:center; }
        .rt-card-duration {
          position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
          font-size:.7rem; font-weight:700; background:#f8fafc;
          border:1px solid #e2e8f0; border-radius:999px;
          padding:.1rem .5rem; color:#64748b; z-index:1;
        }
        .rt-card-time span { font-size:.82rem; color:#64748b; font-weight:500; }
        .rt-card-right { text-align:right; min-width:100px; }
        .rt-card-fare { display:block; font-size:1.3rem; font-weight:800; color:#0f172a; margin-bottom:.3rem; }
        .rt-card-book {
          background:linear-gradient(135deg,#10b981,#059669);
          color:#fff; border:none; border-radius:.5rem;
          padding:.4rem .85rem; font-size:.78rem; font-weight:700;
          cursor:pointer; transition:opacity .2s;
        }
        .rt-card-book:hover { opacity:.85; }

        .rt-empty {
          text-align:center; padding:3rem 2rem; background:#fff;
          border-radius:1.5rem; border:1.5px solid #f1f5f9;
        }
        .rt-empty span { font-size:2.5rem; display:block; margin-bottom:.75rem; }
        .rt-empty h3 { color:#0f172a; margin-bottom:.25rem; }
        .rt-empty p  { color:#94a3b8; font-size:.9rem; }

        /* sidebar */
        .rt-sidebar { display:flex; flex-direction:column; gap:1.5rem; }
        .rt-side-card {
          background:#fff; border:1.5px solid #f1f5f9;
          border-radius:1.5rem; padding:1.5rem;
          box-shadow:0 4px 16px rgba(0,0,0,.05);
        }
        .rt-map-wrap {
          border-radius:1rem; overflow:hidden;
          border:1px solid #e2e8f0; margin-top:.75rem;
          /* ── KEY FIX: isolate stacking so Leaflet z-indexes don't bleed into navbar ── */
          isolation:isolate; position:relative; z-index:0;
        }
        .rt-fare-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:.75rem; margin-top:.75rem; }
        .rt-fare-item { background:#f7f9fc; border-radius:.75rem; padding:.75rem; text-align:center; }
        .rt-fare-item.highlight { background:#f0fdf4; border:1px solid #bbf7d0; }
        .rt-fare-item span     { display:block; font-size:.7rem; color:#94a3b8; text-transform:uppercase; font-weight:600; letter-spacing:.04em; }
        .rt-fare-item strong   { display:block; font-size:1rem; color:#0f172a; margin-top:.15rem; }
        .rt-fare-item.highlight strong { color:#059669; font-size:1.1rem; }
        .rt-tips-text { color:#64748b; font-size:.88rem; line-height:1.6; margin-top:.5rem; }

        @media(max-width:900px){
          .rt-main { grid-template-columns:1fr; }
          .rt-pop-grid { grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
        }

        /* ── PERKS ── */
        .rt-perks {
          background:linear-gradient(135deg,#042f2e 0%,#064e3b 50%,#022c22 100%);
          padding:5rem clamp(1.5rem,5vw,6rem); margin:2rem 0;
          border-radius:1.5rem; border:1px solid rgba(16,185,129,.1);
        }
        .rt-perks .rt-section-intro h2 { color:#fff; }
        .rt-perks-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1.5rem; margin-top:2.5rem; }
        .rt-perk-card {
          background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.03));
          border:1px solid rgba(255,255,255,.12); border-radius:1.5rem;
          padding:2rem; text-align:center; color:#fff;
          transition:transform .25s, background .25s;
        }
        .rt-perk-card:hover { transform:translateY(-4px); background:linear-gradient(145deg,rgba(255,255,255,.12),rgba(255,255,255,.05)); }
        .rt-perk-icon { font-size:2rem; display:block; margin-bottom:.75rem; }
        .rt-perk-card h3 { font-size:1.05rem; font-weight:700; margin:0 0 .4rem; color:#f1f5f9; }
        .rt-perk-card p  { font-size:.88rem; color:rgba(255,255,255,.6); line-height:1.5; margin:0; }

        @media(max-width:768px){
          .rt-perks-grid { grid-template-columns:1fr; }
          .rt-card { flex-direction:column; align-items:flex-start; gap:1rem; }
          .rt-card-center { width:100%; }
          .rt-card-right { width:100%; display:flex; justify-content:space-between; align-items:center; text-align:left; }
        }
      `}</style>
    </main>
  )
}