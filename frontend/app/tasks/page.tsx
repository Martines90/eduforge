'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Button } from '@/components/atoms/Button';
import { TaskTreeView } from '@/components/organisms/TaskTreeView';
import { TreeNode, TaskItem } from '@/types/task-tree';
import { useTranslation } from '@/lib/i18n';
import { AuthenticatedPage } from '@/components/templates/AuthenticatedPage';

/**
 * Tasks Page
 * Browse and search available educational tasks
 * Requires authentication - content is only visible to logged-in users
 */
export default function TasksPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('mathematics');
  const [filterGrade, setFilterGrade] = useState('grade_9_10');
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tree data from backend API
  useEffect(() => {
    const fetchTreeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:3000/api/tree-map/${filterSubject}/${filterGrade}`);
        const data = await response.json();

        if (data.success) {
          setTreeData(data.data.tree);
        } else {
          setError(data.message || 'Failed to load curriculum tree');
        }
      } catch (err: any) {
        console.error('Error fetching tree data:', err);
        setError('Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTreeData();
  }, [filterSubject, filterGrade]);

  // Sample hierarchical data (fallback if API fails)
  const sampleTreeData: TreeNode[] = [
    {
      key: 'halmazok',
      name: 'Halmazok',
      short_description: 'Halmazelméleti alapfogalmak, halmazműveletek, Venn-diagramok',
      level: 0,
      subTopics: [
        {
          key: 'halmaz_fogalma',
          name: 'Halmaz fogalma és megadása',
          short_description: 'Halmaz megadása elemek felsorolásával és utasítással',
          level: 1,
          subTopics: [
            {
              key: 'halmaz_megadas_felsorolassal',
              name: 'Halmaz megadása felsorolással',
              short_description: 'Véges halmazok elemeinek explicit felsorolása',
              level: 2,
              tasks: [
                {
                  id: '1',
                  title: 'Véges halmazok felsorolása - Alapfeladatok',
                  subject: 'Matematika',
                  schoolSystem: 'Magyar NAT',
                  rating: 4.5,
                  views: 1234,
                  gradeLevel: '9-10',
                },
                {
                  id: '2',
                  title: 'Halmazok elemeinek megadása - Gyakorló feladatok',
                  subject: 'Matematika',
                  schoolSystem: 'Magyar NAT',
                  rating: 4.2,
                  views: 856,
                  gradeLevel: '9-10',
                },
              ],
            },
            {
              key: 'halmaz_megadas_utasitassal',
              name: 'Halmaz megadása utasítással',
              short_description: 'Halmaz megadása tulajdonságok meghatározásával',
              level: 2,
              tasks: [
                {
                  id: '3',
                  title: 'Tulajdonságok alapján történő halmazmegadás',
                  subject: 'Matematika',
                  schoolSystem: 'Magyar NAT',
                  rating: 4.7,
                  views: 2103,
                  gradeLevel: '9-10',
                },
              ],
            },
          ],
        },
        {
          key: 'halmazmuveletek',
          name: 'Halmazműveletek',
          short_description: 'Unió, metszet, különbség, komplementer',
          level: 1,
          subTopics: [
            {
              key: 'unio',
              name: 'Unió (egyesítés)',
              short_description: 'Két vagy több halmaz uniója',
              level: 2,
              tasks: [
                {
                  id: '4',
                  title: 'Halmazok uniójának számítása',
                  subject: 'Matematika',
                  schoolSystem: 'Magyar NAT',
                  rating: 4.3,
                  views: 1567,
                  gradeLevel: '9-10',
                },
              ],
            },
            {
              key: 'metszet',
              name: 'Metszet',
              short_description: 'Két vagy több halmaz metszete',
              level: 2,
              tasks: [
                {
                  id: '5',
                  title: 'Halmazok metszetének meghatározása',
                  subject: 'Matematika',
                  schoolSystem: 'Magyar NAT',
                  rating: 4.6,
                  views: 1892,
                  gradeLevel: '9-10',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'szamok',
      name: 'Számok, számhalmazok',
      short_description: 'Természetes, egész, racionális, irracionális és valós számok',
      level: 0,
      subTopics: [
        {
          key: 'termeszetes_szamok',
          name: 'Természetes számok',
          short_description: 'Természetes számok tulajdonságai és műveletek',
          level: 1,
          tasks: [
            {
              id: '6',
              title: 'Természetes számok alapműveletei',
              subject: 'Matematika',
              schoolSystem: 'Magyar NAT',
              rating: 4.1,
              views: 3421,
              gradeLevel: '9-10',
            },
          ],
        },
      ],
    },
    {
      key: 'matematikai_logika',
      name: 'Matematikai logika',
      short_description: 'Állítások, logikai műveletek, következtetések',
      level: 0,
      subTopics: [],
    },
    {
      key: 'kombinatorika',
      name: 'Kombinatorika, gráfok',
      short_description: 'Kombinatorikai alapfogalmak és gráfelméleti alapok',
      level: 0,
      subTopics: [],
    },
    {
      key: 'hatvany_gyok',
      name: 'Hatvány, gyök',
      short_description: 'Hatványozás és gyökvonás',
      level: 0,
      subTopics: [],
    },
    {
      key: 'betus_kifejezesek',
      name: 'Betűs kifejezések',
      short_description: 'Algebrai kifejezések, műveletek, egyszerűsítés',
      level: 0,
      subTopics: [],
    },
    {
      key: 'aranyossag_szazalekszamitas',
      name: 'Arányosság, százalékszámítás',
      short_description: 'Egyenes és fordított arányosság, százalékszámítás',
      level: 0,
      subTopics: [],
    },
    {
      key: 'elsofoku_egyenletek',
      name: 'Elsőfokú egyenletek, egyenlőtlenségek',
      short_description: 'Elsőfokú egyenletek és egyenlőtlenségek megoldása',
      level: 0,
      subTopics: [],
    },
    {
      key: 'masodfoku_egyenletek',
      name: 'Másodfokú egyenletek',
      short_description: 'Másodfokú egyenletek megoldása különböző módszerekkel',
      level: 0,
      subTopics: [],
    },
    {
      key: 'fuggvenyek',
      name: 'A függvény fogalma',
      short_description: 'Függvény definíciója, tulajdonságai, ábrázolása',
      level: 0,
      subTopics: [],
    },
    {
      key: 'geometriai_alapismeretek',
      name: 'Geometriai alapismeretek',
      short_description: 'Pontok, egyenesek, síkok, szögek',
      level: 0,
      subTopics: [],
    },
    {
      key: 'haromszogek',
      name: 'Háromszögek',
      short_description: 'Háromszögek tulajdonságai, kongruencia, hasonlóság',
      level: 0,
      subTopics: [],
    },
    {
      key: 'negyszogek_sokszogek',
      name: 'Négyszögek, sokszögek',
      short_description: 'Négyszögek és sokszögek tulajdonságai',
      level: 0,
      subTopics: [],
    },
    {
      key: 'kor_reszei',
      name: 'A kör és részei',
      short_description: 'Kör, körív, körcikk, körszelet',
      level: 0,
      subTopics: [],
    },
    {
      key: 'transzformaciok',
      name: 'Transzformációk, szerkesztések',
      short_description: 'Geometriai transzformációk és szerkesztési feladatok',
      level: 0,
      subTopics: [],
    },
    {
      key: 'leiro_statisztika_9_10',
      name: 'Leíró statisztika',
      short_description: 'Adatok gyűjtése, rendezése, ábrázolása, jellemzők',
      level: 0,
      subTopics: [],
    },
    {
      key: 'valoszinuseg_szamitas_9_10',
      name: 'Valószínűség-számítás',
      short_description: 'Valószínűségi alapfogalmak és számítások',
      level: 0,
      subTopics: [],
    },
  ];

  const hasNoTasks = !isLoading && treeData.length === 0 && !error;
  const dataToDisplay = treeData.length > 0 ? treeData : sampleTreeData;

  return (
    <AuthenticatedPage>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('Educational Tasks')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('Browse and explore educational tasks for grades 9-12')}
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder={t('Search tasks...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('Subject')}</InputLabel>
              <Select
                value={filterSubject}
                label={t('Subject')}
                onChange={(e) => setFilterSubject(e.target.value)}
              >
                <MenuItem value="mathematics">{t('Mathematics')}</MenuItem>
                <MenuItem value="physics">{t('Physics')}</MenuItem>
                <MenuItem value="chemistry">{t('Chemistry')}</MenuItem>
                <MenuItem value="biology">{t('Biology')}</MenuItem>
                <MenuItem value="geography">{t('Geography')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>{t('Grade')}</InputLabel>
              <Select
                value={filterGrade}
                label={t('Grade')}
                onChange={(e) => setFilterGrade(e.target.value)}
              >
                <MenuItem value="grade_9_10">{t('Grade 9-10')}</MenuItem>
                <MenuItem value="grade_11_12">{t('Grade 11-12')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading State */}
      {isLoading && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" component="div" gutterBottom>
            {t('Loading tasks...')}
          </Typography>
        </Paper>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', backgroundColor: 'error.light' }}>
          <Typography variant="h6" component="div" gutterBottom color="error">
            Error: {error}
          </Typography>
          <Typography variant="body2">
            Using fallback sample data
          </Typography>
        </Paper>
      )}

      {/* Task List or Empty State */}
      {!isLoading && hasNoTasks ? (
        <Paper
          elevation={1}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: 'background.default',
          }}
        >
          <AssignmentIcon
            sx={{
              fontSize: 100,
              color: 'text.secondary',
              opacity: 0.5,
              mb: 2,
            }}
          />
          <Typography variant="h5" component="div" gutterBottom>
            {t('No Tasks Available Yet')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('Educational tasks will appear here once teachers start creating them. Check back soon!')}
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button variant="primary" onClick={() => router.push('/')}>
              {t('Back to Home')}
            </Button>
          </Box>
        </Paper>
      ) : (
        <TaskTreeView
          data={dataToDisplay}
          subject={filterSubject}
          gradeLevel={filterGrade}
          onTaskClick={(task) => {
            console.log('Task clicked:', task);
            router.push(`/tasks/${task.id}`);
          }}
        />
      )}
    </Container>
    </AuthenticatedPage>
  );
}
