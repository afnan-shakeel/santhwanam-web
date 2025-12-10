
# Modal Dialog
- implemet a modal dialog using the <el-dialog>, <el-dialog-backdrop>, and <el-dialog-panel> components.
- this component will be used to create modal dialogs in the application.
- it can have size props like small, medium, large, and extra-large to control the size of the dialog.
- it should support transitions for opening and closing the dialog.
- it should have a backdrop that can be clicked to close the dialog.
- it should be accessible, with proper ARIA attributes.
- it should support slot for custom content inside the dialog.
- it should have methods to open and close the dialog programmatically.
- it should emit events when the dialog is opened or closed.
- it should have a close button inside the dialog panel. and it should be configurable to show or hide the close button.
- it should be persist, meaning not allow to close on clicking outside or pressing escape key.



# Component API

<el-dialog>
Wrapper around the native <dialog> element used to manage the open state and transitions.

Attributes
open	A boolean attribute that indicates whether the dialog is open or closed. You can change the attribute to dynamically open or close the dialog.
Data attributes (Read-only)
data-closed	Present before transitioning in, and when transitioning out.
data-enter	Present when transitioning in.
data-leave	Present when transitioning out.
data-transition	Present when transitioning in or out.
Events
open	Dispatched when the dialog is opened in any way other than by updating the open attribute.
close	Dispatched when the dialog is closed in any way other than by updating the open attribute.
cancel	Dispatched when the user attempts to dismiss the dialog via Escape key or clicking outside. Calling preventDefault() prevents the dialog from closing.
Methods
show()	Shows the dialog in modal mode.
hide()	Hides the dialog. Takes an optional object with a restoreFocus property to disable the default focus restoration.
<dialog>
The native dialog element.

Commands
show-modal	Opens the dialog.
close	Closes the dialog.
<el-dialog-backdrop>
The visual backdrop behind your dialog panel.

Data attributes (Read-only)
data-closed	Present before transitioning in, and when transitioning out.
data-enter	Present when transitioning in.
data-leave	Present when transitioning out.
data-transition	Present when transitioning in or out.
<el-dialog-panel>
The main content area of your dialog. Clicking outside of this will trigger the dialog to close.

Data attributes (Read-only)
data-closed	Present before transitioning in, and when transitioning out.
data-enter	Present when transitioning in.
data-leave	Present when transitioning out.
data-transition	Present when transitioning in or out.

## Examples
### Basic example

Use the <el-dialog> and <el-dialog-panel> components, along with a native <dialog>, to build a dialog:

<button command="show-modal" commandfor="delete-profile" type="button">
  Delete profile
</button>

<el-dialog>
  <dialog id="delete-profile">
    <el-dialog-panel>
      <form method="dialog">
        <h3>Delete profile</h3>
        <p>Are you sure? This action is permanent and cannot be undone.</p>
        <div class="flex gap-4">
          <button command="close" commandfor="delete-profile" type="button">Cancel</button>
          <button type="submit">Delete</button>
        </div>
      </form>
    </el-dialog-panel>
  </dialog>
</el-dialog>
Opening the dialog
You can open dialogs using the show-modal invoker command:

<button command="show-modal" commandfor="delete-profile" type="button">
  Open dialog
</button>

<el-dialog>
  <dialog id="delete-profile"><!-- ... --></dialog>
</el-dialog>
Alternatively you can add the open attribute to the <el-dialog> to open it:

- <el-dialog>
+ <el-dialog open>
    <dialog><!-- ... --></dialog>
  </el-dialog>
You can also programmatically open the dialog using the show() method on <el-dialog>:

<el-dialog id="delete-profile">
  <dialog><!-- ... --></dialog>
</el-dialog>

<script type="module">
  const dialog = document.getElementById('delete-profile');
  dialog.show();
</script>
Closing the dialog
You can close dialogs using the close invoker command:

<button command="close" commandfor="delete-profile" type="button">
  Close dialog
</button>

<el-dialog>
  <dialog id="delete-profile"><!-- ... --></dialog>
</el-dialog>
Alternatively you can remove the open attribute from the <el-dialog> to close it:

- <el-dialog open>
+ <el-dialog>
    <dialog><!-- ... --></dialog>
  </el-dialog>
You can also programmatically close the dialog using the hide() method on <el-dialog>:

<el-dialog id="delete-profile">
  <dialog><!-- ... --></dialog>
</el-dialog>

<script type="module">
  const dialog = document.getElementById('delete-profile');
  dialog.hide();
</script>
Adding a backdrop
Use the <el-dialog-backdrop> component to add a backdrop behind your dialog panel:

<el-dialog>
  <dialog class="backdrop:bg-transparent">
    <el-dialog-backdrop class="fixed inset-0 bg-black/50" />
    <el-dialog-panel><!-- ... --></el-dialog-panel>
  </dialog>
</el-dialog>
The primary benefit of using the <el-dialog-backdrop> component over the native ::backdrop pseudo-element is that it can be transitioned reliably using CSS.

Adding transitions
To animate the opening and closing of the dialog, target the data-closed, data-enter, data-leave, and data-transition attributes with CSS to style the different stages of the transition:

<el-dialog>
  <dialog class="backdrop:bg-transparent">
    <el-dialog-backdrop class="fixed inset-0 bg-black/50 transition duration-200 data-closed:opacity-0" />
    <el-dialog-panel class="block bg-white transition duration-200 data-closed:scale-95 data-closed:opacity-0">
      <!-- ... -->
    </el-dialog-panel>
  </dialog>
</el-dialog>


### better example code:
<!-- Include this script tag or install `@tailwindplus/elements` via npm: -->
<!-- <script src="https://cdn.jsdelivr.net/npm/@tailwindplus/elements@1" type="module"></script> -->
<button command="show-modal" commandfor="dialog" class="rounded-md bg-gray-950/5 px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-950/10 dark:bg-white/10 dark:text-white dark:inset-ring dark:inset-ring-white/5 dark:hover:bg-white/20">Open dialog</button>
<el-dialog>
  <dialog id="dialog" aria-labelledby="dialog-title" class="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent">
    <el-dialog-backdrop class="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in dark:bg-gray-900/50"></el-dialog-backdrop>

    <div tabindex="0" class="flex min-h-full items-end justify-center p-4 text-center focus:outline-none sm:items-center sm:p-0">
      <el-dialog-panel class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-sm sm:p-6 data-closed:sm:translate-y-0 data-closed:sm:scale-95 dark:bg-gray-800 dark:outline dark:-outline-offset-1 dark:outline-white/10">
        <div>
          <div class="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" data-slot="icon" aria-hidden="true" class="size-6 text-green-600 dark:text-green-400">
              <path d="m4.5 12.75 6 6 9-13.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 id="dialog-title" class="text-base font-semibold text-gray-900 dark:text-white">Payment successful</h3>
            <div class="mt-2">
              <p class="text-sm text-gray-500 dark:text-gray-400">Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur amet labore.</p>
            </div>
          </div>
        </div>
        <div class="mt-5 sm:mt-6">
          <button type="button" command="close" commandfor="dialog" class="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:shadow-none dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">Go back to dashboard</button>
        </div>
      </el-dialog-panel>
    </div>
  </dialog>
</el-dialog>
