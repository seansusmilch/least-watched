import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SettingsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // Tab navigation
  get mediaServicesTab() {
    return this.page.getByTestId('media-services-tab');
  }

  get advancedSettingsTab() {
    return this.page.getByTestId('advanced-settings-tab');
  }

  get deletionScoreTab() {
    return this.page.getByTestId('deletion-score-tab');
  }

  // Media Services section - these are actually tabs within the media services
  get sonarrSubTab() {
    return this.page.locator('text=Sonarr').first();
  }

  get radarrSubTab() {
    return this.page.locator('text=Radarr').first();
  }

  get embySubTab() {
    return this.page.locator('text=Emby').first();
  }

  // Add instance buttons - these are actually "Configure" buttons within each service tab
  get addEmbyInstanceButton() {
    return this.page.getByTestId('add-emby-instance');
  }

  get addSonarrInstanceButton() {
    return this.page.getByTestId('add-sonarr-instance');
  }

  get addRadarrInstanceButton() {
    return this.page.getByTestId('add-radarr-instance');
  }

  get instanceList() {
    return this.page.getByTestId('instance-list');
  }

  // Add instance dialog elements
  get addInstanceDialog() {
    return this.page.locator('form').first();
  }

  get instanceNameInput() {
    return this.page.getByTestId('instance-name');
  }

  get instanceUrlInput() {
    return this.page.getByTestId('instance-url');
  }

  get instanceApiKeyInput() {
    return this.page.getByTestId('instance-api-key');
  }

  get testConnectionButton() {
    return this.page.locator('text=Test Connection').first();
  }

  get saveInstanceButton() {
    return this.page.getByTestId('save-instance');
  }

  get cancelInstanceButton() {
    return this.page.locator('text=Cancel').first();
  }

  get connectionStatus() {
    return this.page.locator('[data-testid="connection-status"]').first();
  }

  // Folder selection dialog
  get folderSelectionDialog() {
    return this.page.locator('[data-testid="folder-selection-dialog"]').first();
  }

  get folderList() {
    return this.page.locator('[data-testid="folder-list"]').first();
  }

  get saveFolderSelectionButton() {
    return this.page.locator('[data-testid="save-folder-selection"]').first();
  }

  get cancelFolderSelectionButton() {
    return this.page.locator('[data-testid="cancel-folder-selection"]').first();
  }

  // Deletion Score Settings - these use the actual test IDs from the component
  get playCountWeightSlider() {
    return this.page.getByTestId('play-count-weight');
  }

  get lastWatchedWeightSlider() {
    return this.page.getByTestId('last-watched-weight');
  }

  get fileSizeWeightSlider() {
    return this.page.getByTestId('file-size-weight');
  }

  get ratingWeightSlider() {
    return this.page.getByTestId('rating-weight');
  }

  get resetToDefaultsButton() {
    return this.page.getByTestId('reset-to-defaults');
  }

  get saveScoreSettingsButton() {
    return this.page.getByTestId('save-score-settings');
  }

  // Advanced Settings - these don't exist in the current component
  get batchSizeInput() {
    return this.page.locator('[data-testid="batch-size"]').first();
  }

  get enableLoggingSwitch() {
    return this.page.locator('[data-testid="enable-logging"]').first();
  }

  get logLevelSelect() {
    return this.page.locator('[data-testid="log-level"]').first();
  }

  get saveAdvancedSettingsButton() {
    return this.page.locator('[data-testid="save-advanced-settings"]').first();
  }

  // Navigation methods
  async goToSettings() {
    await this.page.goto('/settings');
  }

  async goToMediaServices() {
    await this.mediaServicesTab.click();
  }

  async goToAdvancedSettings() {
    await this.advancedSettingsTab.click();
  }

  async goToDeletionScoreSettings() {
    await this.deletionScoreTab.click();
  }

  async goToEmbySettings() {
    await this.goToMediaServices();
    await this.embySubTab.click();
  }

  async goToSonarrSettings() {
    await this.goToMediaServices();
    await this.sonarrSubTab.click();
  }

  async goToRadarrSettings() {
    await this.goToMediaServices();
    await this.radarrSubTab.click();
  }

  // Instance management methods
  async addEmbyInstance(name: string, url: string, apiKey: string) {
    await this.addEmbyInstanceButton.click();
    await expect(this.addInstanceDialog).toBeVisible();

    await this.instanceNameInput.fill(name);
    await this.instanceUrlInput.fill(url);
    await this.instanceApiKeyInput.fill(apiKey);

    await this.saveInstanceButton.click();
  }

  async addSonarrInstance(name: string, url: string, apiKey: string) {
    await this.addSonarrInstanceButton.click();
    await expect(this.addInstanceDialog).toBeVisible();

    await this.instanceNameInput.fill(name);
    await this.instanceUrlInput.fill(url);
    await this.instanceApiKeyInput.fill(apiKey);

    await this.saveInstanceButton.click();
  }

  async addRadarrInstance(name: string, url: string, apiKey: string) {
    await this.addRadarrInstanceButton.click();
    await expect(this.addInstanceDialog).toBeVisible();

    await this.instanceNameInput.fill(name);
    await this.instanceUrlInput.fill(url);
    await this.instanceApiKeyInput.fill(apiKey);

    await this.saveInstanceButton.click();
  }

  async testConnection() {
    await this.testConnectionButton.click();
  }

  async expectConnectionSuccess() {
    await expect(
      this.page.locator('text=Connection successful!')
    ).toBeVisible();
  }

  async expectConnectionFailure() {
    await expect(
      this.page.locator('text=Failed to test connection')
    ).toBeVisible();
  }

  async deleteInstance(instanceName: string) {
    const instanceRow = this.instanceList
      .locator(`text="${instanceName}"`)
      .first()
      .locator('..')
      .locator('..');
    await instanceRow.locator('text=Delete').click();
    await this.page.locator('text=Delete Instance').click();
  }

  async editInstance(instanceName: string) {
    const instanceRow = this.instanceList
      .locator(`text="${instanceName}"`)
      .first()
      .locator('..')
      .locator('..');
    await instanceRow.locator('text=Edit').click();
  }

  async toggleInstanceActive(instanceName: string) {
    const instanceRow = this.instanceList
      .locator(`text="${instanceName}"`)
      .first()
      .locator('..')
      .locator('..');
    await instanceRow.locator('[role="switch"]').click();
  }

  async expectInstanceExists(instanceName: string) {
    const instanceRow = this.instanceList
      .locator(`text="${instanceName}"`)
      .first();
    await expect(instanceRow).toBeVisible();
  }

  async expectInstanceNotExists(instanceName: string) {
    const instanceRow = this.instanceList.locator(`text="${instanceName}"`);
    await expect(instanceRow).not.toBeVisible();
  }

  async openFolderSelection(instanceName: string) {
    const instanceRow = this.instanceList
      .locator(`text="${instanceName}"`)
      .first()
      .locator('..')
      .locator('..');
    await instanceRow.locator('text=Select Folders').click();
  }

  async selectFolder(folderPath: string) {
    await this.page.locator(`text="${folderPath}"`).click();
  }

  async deselectFolder(folderPath: string) {
    await this.page.locator(`text="${folderPath}"`).click();
  }

  async saveFolderSelection() {
    await this.saveFolderSelectionButton.click();
  }

  async cancelFolderSelection() {
    await this.cancelFolderSelectionButton.click();
  }

  async expectFolderSelected(folderPath: string) {
    await expect(this.page.locator(`text="${folderPath}"`)).toBeVisible();
  }

  async expectFolderNotSelected(folderPath: string) {
    await expect(this.page.locator(`text="${folderPath}"`)).not.toBeVisible();
  }

  // Deletion Score Settings methods
  async setPlayCountWeight(weight: number) {
    const slider = this.playCountWeightSlider;
    await slider.waitFor({ state: 'visible' });

    console.log('Setting play count weight to:', weight);

    // For Radix UI sliders, we need to click on the track to set the value
    // First get the current value to determine direction
    const currentValue = await this.getSliderValue(slider);
    console.log('Current value:', currentValue);

    if (currentValue !== weight) {
      // Click on the track to set the value
      const track = slider.locator('[data-slot="slider-track"]');
      const trackBox = await track.boundingBox();

      if (trackBox) {
        // Calculate the position to click based on the desired value
        const max = 30; // Based on the component max value
        const percentage = weight / max;
        const clickX = trackBox.x + trackBox.width * percentage;
        const clickY = trackBox.y + trackBox.height / 2;

        await slider.page().mouse.click(clickX, clickY);
        console.log('Clicked at position:', clickX, clickY);
      }
    }
  }

  async setLastWatchedWeight(weight: number) {
    const slider = this.lastWatchedWeightSlider;
    await slider.waitFor({ state: 'visible' });

    // For Radix UI sliders, we need to click on the track to set the value
    const currentValue = await this.getSliderValue(slider);

    if (currentValue !== weight) {
      const track = slider.locator('[data-slot="slider-track"]');
      const trackBox = await track.boundingBox();

      if (trackBox) {
        const max = 50; // Based on the component max value
        const percentage = weight / max;
        const clickX = trackBox.x + trackBox.width * percentage;
        const clickY = trackBox.y + trackBox.height / 2;

        await slider.page().mouse.click(clickX, clickY);
      }
    }
  }

  async setFileSizeWeight(weight: number) {
    const slider = this.fileSizeWeightSlider;
    await slider.waitFor({ state: 'visible' });

    // For Radix UI sliders, we need to click on the track to set the value
    const currentValue = await this.getSliderValue(slider);

    if (currentValue !== weight) {
      const track = slider.locator('[data-slot="slider-track"]');
      const trackBox = await track.boundingBox();

      if (trackBox) {
        const max = 50; // Based on the component max value
        const percentage = weight / max;
        const clickX = trackBox.x + trackBox.width * percentage;
        const clickY = trackBox.y + trackBox.height / 2;

        await slider.page().mouse.click(clickX, clickY);
      }
    }
  }

  async setRatingWeight(weight: number) {
    const slider = this.ratingWeightSlider;
    await slider.waitFor({ state: 'visible' });

    // For Radix UI sliders, we need to click on the track to set the value
    const currentValue = await this.getSliderValue(slider);

    if (currentValue !== weight) {
      const track = slider.locator('[data-slot="slider-track"]');
      const trackBox = await track.boundingBox();

      if (trackBox) {
        const max = 30; // Based on the component max value
        const percentage = weight / max;
        const clickX = trackBox.x + trackBox.width * percentage;
        const clickY = trackBox.y + trackBox.height / 2;

        await slider.page().mouse.click(clickX, clickY);
      }
    }
  }

  async resetDeletionScoreToDefaults() {
    await this.resetToDefaultsButton.click();
    // Click the confirm button in the dialog
    await this.page.locator('text=Reset to Defaults').last().click();
  }

  async saveDeletionScoreSettings() {
    await this.saveScoreSettingsButton.click();
    // Click the confirm button in the dialog
    await this.page.locator('text=Save & Recalculate').click();
  }

  async getSliderValue(
    slider: ReturnType<Page['getByTestId']>
  ): Promise<number> {
    // For Radix UI sliders, get the value from the aria-valuenow attribute
    const value = await slider.evaluate((el) => {
      // Try to get the value from the root element's aria-valuenow
      const ariaValue = el.getAttribute('aria-valuenow');
      if (ariaValue) {
        return parseFloat(ariaValue);
      }

      // If not found, try to get from the thumb element
      const thumb = el.querySelector('[data-slot="slider-thumb"]');
      if (thumb) {
        const thumbAriaValue = thumb.getAttribute('aria-valuenow');
        if (thumbAriaValue) {
          return parseFloat(thumbAriaValue);
        }
      }

      // Fallback: try to get from any element with aria-valuenow
      const anyElement = el.querySelector('[aria-valuenow]');
      if (anyElement) {
        const anyAriaValue = anyElement.getAttribute('aria-valuenow');
        if (anyAriaValue) {
          return parseFloat(anyAriaValue);
        }
      }

      return 0;
    });
    return value;
  }

  async expectDeletionScoreWeights(weights: {
    playCount: number;
    lastWatched: number;
    fileSize: number;
    rating: number;
  }) {
    expect(await this.getSliderValue(this.playCountWeightSlider)).toBeCloseTo(
      weights.playCount,
      2
    );
    expect(await this.getSliderValue(this.lastWatchedWeightSlider)).toBeCloseTo(
      weights.lastWatched,
      2
    );
    expect(await this.getSliderValue(this.fileSizeWeightSlider)).toBeCloseTo(
      weights.fileSize,
      2
    );
    expect(await this.getSliderValue(this.ratingWeightSlider)).toBeCloseTo(
      weights.rating,
      2
    );
  }

  // Advanced settings methods - these don't exist in current component
  async setBatchSize(size: number) {
    await this.batchSizeInput.fill(size.toString());
  }

  async toggleLogging(enabled: boolean) {
    const switchElement = this.enableLoggingSwitch;
    const isChecked = await switchElement.isChecked();
    if (isChecked !== enabled) {
      await switchElement.click();
    }
  }

  async setLogLevel(level: string) {
    await this.logLevelSelect.click();
    await this.page.locator(`text="${level}"`).click();
  }

  async saveAdvancedSettings() {
    await this.saveAdvancedSettingsButton.click();
  }

  async expectBatchSize(expectedSize: number) {
    await expect(this.batchSizeInput).toHaveValue(expectedSize.toString());
  }

  async expectLoggingEnabled(expected: boolean) {
    const switchElement = this.enableLoggingSwitch;
    const isChecked = await switchElement.isChecked();
    expect(isChecked).toBe(expected);
  }

  async expectLogLevel(expectedLevel: string) {
    await expect(this.logLevelSelect).toHaveText(expectedLevel);
  }

  async expectValidationError(field: string, message: string) {
    await expect(this.page.locator(`text="${message}"`)).toBeVisible();
  }

  async expectNoValidationErrors() {
    // This would check for absence of validation error messages
    // Implementation depends on how validation errors are displayed
  }

  async expectSettingsPersisted() {
    // This would verify settings are saved
    // Implementation depends on how success is indicated
  }

  async expectSettingsPageLoaded() {
    await expect(this.page.locator('h1:has-text("Settings")')).toBeVisible();
  }

  async expectMediaServicesTabActive() {
    await expect(this.mediaServicesTab).toHaveAttribute('data-state', 'active');
  }

  async expectAdvancedSettingsTabActive() {
    await expect(this.advancedSettingsTab).toHaveAttribute(
      'data-state',
      'active'
    );
  }

  async expectDeletionScoreTabActive() {
    await expect(this.deletionScoreTab).toHaveAttribute('data-state', 'active');
  }
}
