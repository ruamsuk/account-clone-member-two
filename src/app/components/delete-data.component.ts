import { Component, inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ConfirmationService, TreeNode } from 'primeng/api';
import { DeleteDataService } from '../services/delete-data.service';
import { SelectorService } from '../services/selector.service';
import { SharedModule } from '../shared/shared.module';

@Component({
  selector: 'app-delete-data',
  imports: [SharedModule,],
  template: `
    <p-confirmdialog></p-confirmdialog>
    <div class="flex  flex-wrap p-fluid justify-center items-center">
      <p-card>
        <div class="text-center font-thasadith font-medium text-2xl md:text-3xl">
          <span class="text-indigo-400">
          ลบข้อมูลรายปี
          </span>
        </div>
        <div class="card flex justify-center mt-5">
          <form>
            <div class="flex grow">
              <p-floatLabel variant="on">
                <p-treeSelect
                  [formControl]="collectionsToDelete"
                  [options]="nodes"
                  selectionMode="checkbox"
                  (onNodeSelect)="onStartYearSelect($event)"
                  containerStyleClass="w-60"
                  placeholder="Choose Collection"
                />
                <label for="treeSelect">Choose Collection</label>
              </p-floatLabel>
              <div class="flex grow ml-2">
                <p-floatLabel variant="on">
                  <p-treeSelect
                    [formControl]="yearToDelete"
                    [options]="years"
                    (onNodeSelect)="onEndYearSelect($event)"
                    containerStyleClass="w-full"
                    placeholder="Choose Year"
                  />
                  <label for="treeSelect">Choose Year</label>
                </p-floatLabel>
              </div>
            </div>
          </form>
        </div>
        <div class="my-3">
          <p-message
            severity="error"
            icon="pi pi-exclamation-circle"
            text="ระวัง!" styleClass="h-full">
            <span class="ml-2 text-gray-300">ข้อมูลที่จะลบเหล่านี้ ไม่สามารถกู้คืนได้หากลบไปแล้ว โปรดระมัดระวัง!</span>
          </p-message>
        </div>
      </p-card>
    </div>
  `,
  styles: ``
})
export class DeleteDataComponent implements OnInit {
  private deleteDataService = inject(DeleteDataService);
  private selectService = inject(SelectorService);
  private confirmService = inject(ConfirmationService);

  collectionsToDelete = new FormControl();
  yearToDelete = new FormControl();
  nodes: any[] = [];
  years: any[] = [];
  yearDelete: number = 0;


  ngOnInit() {
    this.deleteDataService.getTreeNodes().then((data) => {
      this.nodes = data;
    });
    this.selectService.getYear2().then((data) => {
      this.years = data;
    });
  }

  onStartYearSelect(event: any) {
    console.log(event);
  }

  onEndYearSelect(event: any) {
    this.yearDelete = event.node.value - 543;
    this.deleteData().then();
  }

  async deleteData() {
    const selectedCollections = this.collectionsToDelete?.value as TreeNode[];
    const yearToDelete = this.yearDelete;

    if (selectedCollections && selectedCollections.length > 0) {
      this.confirmService.confirm({
        message: `Are you sure to delete year: ${this.yearDelete} ?`,
        header: 'Confirmation',
        closable: true,
        closeOnEscape: true,
        icon: 'pi pi-exclamation-triangle',
        rejectButtonProps: {
          label: 'Cancel',
          severity: 'secondary',
          outlined: true,
        },
        acceptButtonProps: {
          label: 'Delete',
          severity: 'danger',
        },
        accept: async () => {
          const selectedKeys = selectedCollections.map(node => node.key);
          for (const collectionKey of selectedKeys) {
            await this.deleteDataService.deleteByYear(<string>collectionKey, yearToDelete);
          }
          this.collectionsToDelete.reset();
          this.yearToDelete.reset();
        },
        reject: () => {
          this.collectionsToDelete.reset();
          this.yearToDelete.reset();
        },
      });
    }
  }
}
