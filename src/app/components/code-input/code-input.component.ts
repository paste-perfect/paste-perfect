import { Component, inject } from "@angular/core";
import { Textarea } from "primeng/textarea";
import { FormsModule } from "@angular/forms";
import { CodeService } from "@services/code.service";

/**
 * This component provides a textarea input for users to enter or paste their code.
 * The input is bound to the CodeService for managing the data.
 */
@Component({
  selector: "app-code-input",
  imports: [Textarea, FormsModule],
  templateUrl: "./code-input.component.html",
  styleUrl: "./code-input.component.scss",
})
export class CodeInputComponent {
  /**
   * Service for managing code content and highlighted output.
   */
  protected readonly codeService: CodeService = inject(CodeService);
}
