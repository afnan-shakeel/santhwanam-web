# usage:
<app-modal 
  id="delete-confirmation"
  title="Delete Profile"
  size="md"
  [showCloseButton]="true"
  [persist]="false"
  [(open)]="isModalOpen">
  
  <p>Are you sure you want to delete your profile?</p>
  
  <div footer class="flex gap-3 justify-end">
    <button>Cancel</button>
    <button>Delete</button>
  </div>
</app-modal>