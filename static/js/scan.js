// Handle scan progress and completion
document.addEventListener('DOMContentLoaded', function () {
  // Check if scan is in progress
  const scanInProgress = document.querySelector('.alert-info');
  const scanComplete = document.querySelector('.alert-success');
  const redirectMessage = document.getElementById('redirect-message');

  // Use sessionStorage to track if we've already redirected
  const hasRedirected = sessionStorage.getItem('scanRedirected');

  // Elements for progress tracking
  const progressBar = document.querySelector('.progress-bar');
  const progressPercent = document.querySelector('.progress-percentage');
  const progressProcessed = document.querySelector(
    '.col-md-4:first-child p.mb-0'
  );
  const progressTotal = document.querySelector('.col-md-4:first-child p.mb-0');
  const unwatchedCount = document.querySelector(
    '.col-md-4:nth-child(2) p.mb-0'
  );
  const currentItem = document.querySelector('.current-item');

  // Function to update progress UI
  function updateProgressUI(data) {
    if (!data || !data.progress) return;

    const progress = data.progress;

    // Update progress bar
    if (progressBar) {
      progressBar.style.width = `${progress.percent_complete}%`;
      progressBar.setAttribute('aria-valuenow', progress.percent_complete);
    }

    // Update percentage text
    if (progressPercent) {
      progressPercent.textContent = `${progress.percent_complete}%`;
    }

    // Update counts - directly update the HTML content
    if (document.querySelector('.col-md-4:first-child p.mb-0')) {
      document.querySelector(
        '.col-md-4:first-child p.mb-0'
      ).textContent = `${progress.processed_items} / ${progress.total_items}`;
    }

    // Update unwatched count
    if (document.querySelector('.col-md-4:nth-child(2) p.mb-0')) {
      document.querySelector('.col-md-4:nth-child(2) p.mb-0').textContent =
        progress.unwatched_found;
    }

    // Update current item
    if (document.querySelector('.current-item')) {
      document.querySelector('.current-item').textContent =
        progress.current_item || '';
    }

    // If scan is complete, reload the page to show completion
    if (!data.scan_in_progress && data.scan_complete) {
      window.location.reload();
    }
  }

  // Function to fetch progress updates
  function fetchProgress() {
    fetch('/api/scan-progress')
      .then((response) => response.json())
      .then((data) => {
        updateProgressUI(data);

        // Continue polling if scan is in progress
        if (data.scan_in_progress) {
          setTimeout(fetchProgress, 1000); // Update every second
        }
      })
      .catch((error) => {
        console.error('Error fetching progress:', error);
        // Retry after a delay even if there was an error
        setTimeout(fetchProgress, 3000);
      });
  }

  if (scanInProgress) {
    // Start polling for progress updates
    fetchProgress();
  } else if (scanComplete && !hasRedirected && redirectMessage) {
    // Set the flag to prevent multiple redirects
    sessionStorage.setItem('scanRedirected', 'true');

    // Show a message that we're redirecting
    redirectMessage.textContent = 'Redirecting to results page in 3 seconds...';

    // Redirect to home page after 3 seconds
    setTimeout(function () {
      window.location.href = '/';
    }, 3000);
  }

  // Clear the redirect flag when on the home page
  if (window.location.pathname === '/') {
    sessionStorage.removeItem('scanRedirected');
  }
});
