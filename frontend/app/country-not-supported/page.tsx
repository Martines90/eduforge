'use client';

import { Container, Typography, Box, Paper, Button } from '@mui/material';
import PublicIcon from '@mui/icons-material/Public';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CountrySelect } from '@/components/molecules/CountrySelect/CountrySelect';
import { CountryCode } from '@/types/i18n';
import { setCookie, COOKIE_NAMES } from '@/lib/utils/cookies';

/**
 * Country Not Supported page
 * Shown when a user's country is detected but not yet supported by EduForger
 *
 * User flow:
 * - Middleware detects user's country via IP
 * - Country is not in our supported list (US, HU, MX)
 * - User is redirected here
 * - Cookie is set to 'UNSUPPORTED' to prevent repeated redirects
 * - User can select a supported country to continue
 */
export default function CountryNotSupported() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | ''>('');

  useEffect(() => {
    // Track analytics if needed
    console.log('[CountryNotSupported] User from unsupported country visited');
  }, []);

  const handleCountryChange = (country: CountryCode) => {
    setSelectedCountry(country);
  };

  const handleContinue = () => {
    if (selectedCountry) {
      // Set the cookie with selected country
      setCookie(COOKIE_NAMES.COUNTRY, selectedCountry);
      // Redirect to home
      router.push('/');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, md: 6 },
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <PublicIcon
              sx={{
                fontSize: 100,
                color: 'primary.main',
                opacity: 0.8,
              }}
            />
          </Box>

          <Typography variant="h3" component="h1" gutterBottom>
            Your Country Will Be Supported Soon!
          </Typography>

          <Typography variant="h6" component="div" color="text.secondary" paragraph sx={{ mt: 3 }}>
            We&apos;re working hard to bring EduForger to your region.
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 2 }}>
            EduForger is currently available in:
          </Typography>

          <Box
            component="ul"
            sx={{
              textAlign: 'left',
              display: 'inline-block',
              color: 'text.secondary',
              mb: 3,
              fontSize: '1.1rem',
            }}
          >
            <li>🇺🇸 United States (English)</li>
            <li>🇭🇺 Hungary (Magyar)</li>
            <li>🇲🇽 Mexico (Español)</li>
          </Box>

          <Typography variant="body1" color="text.secondary" paragraph sx={{ mt: 3 }}>
            We&apos;re actively expanding to new countries and languages. Please check back soon!
          </Typography>

          <Box
            sx={{
              mt: 4,
              p: 3,
              bgcolor: 'primary.light',
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom color="primary.contrastText">
              Want to use EduForger now?
            </Typography>
            <Typography variant="body2" color="primary.contrastText" paragraph>
              Select one of our supported countries to continue:
            </Typography>

            <Box sx={{ mt: 2, mb: 2 }}>
              <CountrySelect
                value={selectedCountry}
                onChange={handleCountryChange}
                label="Select a Country"
              />
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              disabled={!selectedCountry}
              onClick={handleContinue}
              sx={{ mt: 2 }}
            >
              Continue with {selectedCountry && selectedCountry}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              bgcolor: 'info.light',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2" color="text.primary">
              Want to be notified when we launch in your country?
              <br />
              Contact us at:{' '}
              <a
                href="mailto:info@eduforger.com"
                style={{ color: 'inherit', fontWeight: 'bold' }}
              >
                info@eduforger.com
              </a>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
