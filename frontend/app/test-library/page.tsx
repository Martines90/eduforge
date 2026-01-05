"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Card,
  CardContent,
  CardActions,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { Button } from "@/components/atoms/Button";
import { Pagination } from "@/components/molecules/Pagination";
import { useTranslation } from "@/lib/i18n";
import { fetchPublishedTests } from "@/lib/services/test.service";
import type { PublishedTest } from "@/types/test.types";
import { SubjectSelector } from "@/components/molecules/SubjectSelector";
import { SUBJECTS } from "@/lib/data/subjects";
import type { Subject } from "@/types/i18n";

/**
 * Test Library Page
 * Browse and search published tests from the community
 */
export default function TestLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();

  // Get translated subject label
  const getSubjectLabel = (subject: Subject): string => {
    const subjectOption = SUBJECTS.find((s) => s.value === subject);
    if (!subjectOption) return subject;
    return subjectOption.labelEN;
  };

  // Get user's subject from localStorage (for teachers)
  const getUserSubject = (): string => {
    if (typeof window === "undefined") return "mathematics";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        // Return teacher's subject if available, otherwise fallback to mathematics
        return user.subject || "mathematics";
      }
    } catch (error) {
      console.error("Error getting user subject:", error);
    }
    return "mathematics";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(
    getUserSubject() as Subject
  );
  const [sortBy, setSortBy] = useState<"recent" | "views" | "downloads">(
    "recent"
  );

  // Data state
  const [tests, setTests] = useState<PublishedTest[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 12 items for grid layout (4 columns x 3 rows)

  // Get user's country from localStorage (for filtering tests by country)
  const getUserCountry = (): string => {
    if (typeof window === "undefined") return "US";
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.country || "US";
      }
    } catch (error) {
      console.error("Error getting user country:", error);
    }
    return "US";
  };

  // Fetch tests from API
  const loadTests = async () => {
    setLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * itemsPerPage;
      const country = getUserCountry();

      console.log("[TestLibrary] Fetching tests:", {
        country,
        subject: selectedSubject,
        search: searchQuery,
        sort: sortBy,
        limit: itemsPerPage,
        offset,
      });

      const response = await fetchPublishedTests({
        country,
        subject: selectedSubject || undefined,
        search: searchQuery || undefined,
        sort: sortBy,
        limit: itemsPerPage,
        offset,
      });

      console.log("[TestLibrary] Received tests:", response);

      setTests(response.tests);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error("[TestLibrary] Error loading tests:", err);
      setError(err.message || "Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  // Load tests when filters or page changes
  useEffect(() => {
    loadTests();
  }, [currentPage, selectedSubject, searchQuery, sortBy]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSubjectChange = (subject: Subject | Subject[] | null) => {
    // For single select, we expect Subject | null
    setSelectedSubject(subject as Subject | null);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: "recent" | "views" | "downloads") => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t("Test Library")}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t(
              "Browse and discover published tests from the teacher community"
            )}
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder={t("Search tests...")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <SubjectSelector
            value={selectedSubject}
            onChange={handleSubjectChange}
            type="chip"
            isMultiSelect={false}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mr: 1, alignSelf: "center" }}
            >
              {t("Sort by:")}
            </Typography>
            <Chip
              label={t("Recent")}
              onClick={() => handleSortChange("recent")}
              color={sortBy === "recent" ? "primary" : "default"}
              variant={sortBy === "recent" ? "filled" : "outlined"}
              size="small"
              disabled={loading}
            />
            <Chip
              label={t("Most Viewed")}
              onClick={() => handleSortChange("views")}
              color={sortBy === "views" ? "primary" : "default"}
              variant={sortBy === "views" ? "filled" : "outlined"}
              size="small"
              disabled={loading}
            />
            <Chip
              label={t("Most Downloaded")}
              onClick={() => handleSortChange("downloads")}
              color={sortBy === "downloads" ? "primary" : "default"}
              variant={sortBy === "downloads" ? "filled" : "outlined"}
              size="small"
              disabled={loading}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              {t("Loading tests...")}
            </Typography>
          </Box>
        ) : tests.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              bgcolor: "grey.50",
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t("No published tests yet")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchQuery || selectedSubject
                ? t("Try adjusting your search or filters")
                : t("Be the first to publish a test!")}
            </Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3}>
              {tests.map((test) => (
                <Grid item xs={12} sm={6} md={4} key={test.publicId}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        gutterBottom
                        noWrap
                        title={test.name}
                      >
                        {test.name}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          gap: 0.5,
                          mb: 2,
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          label={getSubjectLabel(test.subject as Subject)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        {test.gradeLevel && (
                          <Chip
                            label={test.gradeLevel
                              .replace("grade_", "Grade ")
                              .replace("_", "-")}
                            size="small"
                          />
                        )}
                      </Box>

                      <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {test.taskCount} {t("tasks")}
                        </Typography>
                        {test.totalScore && (
                          <Typography variant="body2" color="text.secondary">
                            {test.totalScore} {t("points")}
                          </Typography>
                        )}
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        {test.viewCount} {t("views")}
                      </Typography>
                    </CardContent>

                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        variant="primary"
                        fullWidth
                        startIcon={<VisibilityIcon />}
                        onClick={() =>
                          router.push(`/tests/${test.publicId}`)
                        }
                      >
                        {t("View Test")}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </Paper>
    </Container>
  );
}
