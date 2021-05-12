import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { REQUIRED_MSG } from '@shared/constants';
import { IMock, ohMyDataId } from '@shared/type';
import { UpsertMock } from 'src/app/store/actions';

@Component({
  selector: 'oh-my-mock-details',
  templateUrl: './mock-details.component.html',
  styleUrls: ['./mock-details.component.scss']
})
export class MockDetailsComponent implements OnChanges {
  @Input() mock: IMock;
  @Input() domain: string;
  @Input() dataId: ohMyDataId;

  requiredMsg = REQUIRED_MSG;
  form: FormGroup;

  @Dispatch() upsertMock = (update: Partial<IMock>) =>
    new UpsertMock({
      id: this.dataId,
      mock: { id: this.mock.id, ...update }
    }, this.domain);

  ngOnChanges(): void {
    this.form = new FormGroup({
      delay: new FormControl(this.mock.delay, { updateOn: 'blur' }),
      statusCode: new FormControl(this.mock.statusCode, {
        validators: [Validators.required], updateOn: 'blur'
      }),
      name: new FormControl(this.mock.name, { updateOn: 'blur' })
    });

    this.form.valueChanges.subscribe(values => {
      const update: Partial<IMock> = { name: values.name, delay: values.delay || 0 }
      if (!this.statusCodeCtrl.hasError('required')) {
        update.statusCode = values.statusCode;
      }

      this.upsertMock(update);
    });
  }

  get nameCtrl(): FormControl {
    return this.form.get('name') as FormControl;
  }

  get statusCodeCtrl(): FormControl {
    return this.form.get('statusCode') as FormControl;
  }

  get delayCtrl(): FormControl {
    return this.form.get('delay') as FormControl;
  }
}
